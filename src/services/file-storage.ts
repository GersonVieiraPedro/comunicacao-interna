import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { IMAGE_LIMITS, formatBytes } from "@/lib/image-limits";
import { optimizeImageBuffer } from "@/services/image-optimize";
import {
  azureBlobObjectUrl,
  parseAzureBlobToken,
} from "@/lib/azure-blob";

const ALLOWED = new Set<string>(IMAGE_LIMITS.allowedMime);

export type StoredImage = {
  path: string;
  url: string;
  storage: "disk" | "azure" | "vercel-blob" | "data";
  originalBytes: number;
  optimizedBytes: number;
  contentType: string;
};

function assertImage(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new ValidationError(`Imagem deve ser ${IMAGE_LIMITS.allowedLabel}.`);
  }
  if (file.size > IMAGE_LIMITS.maxUploadBytes) {
    throw new ValidationError(
      `Imagem com ${formatBytes(file.size)}. Máximo: ${IMAGE_LIMITS.maxUploadLabel}.`,
    );
  }
}

function readAzureBlobToken() {
  return (process.env.AZURE_BLOB_TOKEN || getEnv().AZURE_BLOB_TOKEN || "").trim();
}

async function trySaveToAzure(
  folder: "covers" | "inline",
  buffer: Buffer,
  contentType: string,
  extension: string,
): Promise<Omit<StoredImage, "originalBytes" | "optimizedBytes" | "contentType"> | null> {
  const token = readAzureBlobToken();
  if (!token) return null;

  try {
    const parsed = parseAzureBlobToken(token);
    const blobName = `${folder}/${randomUUID()}.${extension}`;
    const putUrl = azureBlobObjectUrl(parsed.containerBaseUrl, blobName, parsed.sasQuery);

    const response = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "x-ms-version": "2022-11-02",
        "Content-Type": contentType,
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200);
      logger.error("azure_blob_upload_failed", {
        status: response.status,
        detail,
      });
      return null;
    }

    return {
      path: `azure:${blobName}`,
      url: `/api/media/${blobName}`,
      storage: "azure",
    };
  } catch (error) {
    logger.error("azure_blob_upload_error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function trySaveToDisk(
  folder: "covers" | "inline",
  buffer: Buffer,
  extension: string,
): Promise<Omit<StoredImage, "originalBytes" | "optimizedBytes" | "contentType">> {
  const env = getEnv();
  const dir = path.resolve(process.cwd(), env.FILE_STORAGE_DIR, folder);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(dir, filename), buffer);
  const relative = `${folder}/${filename}`;
  return {
    path: relative,
    url: `/api/media/${relative}`,
    storage: "disk",
  };
}

async function trySaveToVercelBlob(
  folder: "covers" | "inline",
  buffer: Buffer,
  contentType: string,
  extension: string,
): Promise<Omit<StoredImage, "originalBytes" | "optimizedBytes" | "contentType"> | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${randomUUID()}.${extension}`, buffer, {
      access: "public",
      token,
      contentType,
    });
    return {
      path: blob.url,
      url: blob.url,
      storage: "vercel-blob",
    };
  } catch (error) {
    logger.error("vercel_blob_upload_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function toDataUrl(
  buffer: Buffer,
  contentType: string,
): Omit<StoredImage, "originalBytes" | "optimizedBytes" | "contentType"> {
  const url = `data:${contentType};base64,${buffer.toString("base64")}`;
  return { path: url, url, storage: "data" };
}

async function saveImageFile(file: File, folder: "covers" | "inline"): Promise<StoredImage> {
  assertImage(file);
  const raw = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeImageBuffer(raw, folder === "covers" ? "cover" : "inline");

  const azure = await trySaveToAzure(
    folder,
    optimized.buffer,
    optimized.contentType,
    optimized.extension,
  );
  if (azure) {
    return {
      ...azure,
      originalBytes: optimized.originalBytes,
      optimizedBytes: optimized.optimizedBytes,
      contentType: optimized.contentType,
    };
  }

  const vercelBlob = await trySaveToVercelBlob(
    folder,
    optimized.buffer,
    optimized.contentType,
    optimized.extension,
  );
  if (vercelBlob) {
    return {
      ...vercelBlob,
      originalBytes: optimized.originalBytes,
      optimizedBytes: optimized.optimizedBytes,
      contentType: optimized.contentType,
    };
  }

  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (onVercel) {
    logger.warn("media_using_data_url", { folder, reason: "vercel_without_azure_blob" });
    return {
      ...toDataUrl(optimized.buffer, optimized.contentType),
      originalBytes: optimized.originalBytes,
      optimizedBytes: optimized.optimizedBytes,
      contentType: optimized.contentType,
    };
  }

  try {
    const disk = await trySaveToDisk(folder, optimized.buffer, optimized.extension);
    return {
      ...disk,
      originalBytes: optimized.originalBytes,
      optimizedBytes: optimized.optimizedBytes,
      contentType: optimized.contentType,
    };
  } catch (error) {
    logger.error("disk_upload_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      ...toDataUrl(optimized.buffer, optimized.contentType),
      originalBytes: optimized.originalBytes,
      optimizedBytes: optimized.optimizedBytes,
      contentType: optimized.contentType,
    };
  }
}

export async function saveCoverFile(file: File): Promise<StoredImage> {
  return saveImageFile(file, "covers");
}

export async function saveInlineImage(file: File): Promise<StoredImage> {
  return saveImageFile(file, "inline");
}

export function azureReadUrl(relativeOrAzurePath: string): string | null {
  const token = readAzureBlobToken();
  if (!token) return null;
  try {
    const parsed = parseAzureBlobToken(token);
    const relative = relativeOrAzurePath.replace(/^azure:/, "").replace(/^\/+/, "");
    return azureBlobObjectUrl(parsed.containerBaseUrl, relative, parsed.sasQuery);
  } catch {
    return null;
  }
}

export function coverAbsolutePath(coverPath: string) {
  if (
    coverPath.startsWith("data:") ||
    coverPath.startsWith("http://") ||
    coverPath.startsWith("https://") ||
    coverPath.startsWith("azure:")
  ) {
    throw new ValidationError("Caminho de arquivo inválido.");
  }
  const env = getEnv();
  const resolved = path.resolve(process.cwd(), env.FILE_STORAGE_DIR, coverPath);
  const root = path.resolve(process.cwd(), env.FILE_STORAGE_DIR);
  if (!resolved.startsWith(root)) {
    throw new ValidationError("Caminho de arquivo inválido.");
  }
  return resolved;
}
