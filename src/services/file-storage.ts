import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  azureBlobObjectUrl,
  parseAzureBlobToken,
} from "@/lib/azure-blob";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export type StoredImage = {
  path: string;
  url: string;
  storage: "disk" | "azure" | "vercel-blob" | "data";
};

function assertImage(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new ValidationError("Imagem deve ser JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new ValidationError("Imagem deve ter no máximo 2 MB.");
  }
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function readAzureBlobToken() {
  // literal + getEnv: Vercel injeta process.env.AZURE_BLOB_TOKEN no bundle
  return (process.env.AZURE_BLOB_TOKEN || getEnv().AZURE_BLOB_TOKEN || "").trim();
}

async function trySaveToAzure(
  file: File,
  folder: "covers" | "inline",
  buffer: Buffer,
): Promise<StoredImage | null> {
  const token = readAzureBlobToken();
  if (!token) return null;

  try {
    const parsed = parseAzureBlobToken(token);
    const blobName = `${folder}/${randomUUID()}.${extensionFor(file.type)}`;
    const putUrl = azureBlobObjectUrl(parsed.containerBaseUrl, blobName, parsed.sasQuery);

    const response = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "x-ms-version": "2022-11-02",
        "Content-Type": file.type,
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

    // path interno + URL autenticada via /api/media (anexa SAS no GET)
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

async function trySaveToDisk(file: File, folder: "covers" | "inline", buffer: Buffer): Promise<StoredImage> {
  const env = getEnv();
  const dir = path.resolve(process.cwd(), env.FILE_STORAGE_DIR, folder);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${extensionFor(file.type)}`;
  await writeFile(path.join(dir, filename), buffer);
  const relative = `${folder}/${filename}`;
  return {
    path: relative,
    url: `/api/media/${relative}`,
    storage: "disk",
  };
}

async function trySaveToVercelBlob(
  file: File,
  folder: "covers" | "inline",
  buffer: Buffer,
): Promise<StoredImage | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${randomUUID()}.${extensionFor(file.type)}`, buffer, {
      access: "public",
      token,
      contentType: file.type,
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

function toDataUrl(file: File, buffer: Buffer): StoredImage {
  const url = `data:${file.type};base64,${buffer.toString("base64")}`;
  return { path: url, url, storage: "data" };
}

async function saveImageFile(file: File, folder: "covers" | "inline"): Promise<StoredImage> {
  assertImage(file);
  const buffer = Buffer.from(await file.arrayBuffer());

  const azure = await trySaveToAzure(file, folder, buffer);
  if (azure) return azure;

  const vercelBlob = await trySaveToVercelBlob(file, folder, buffer);
  if (vercelBlob) return vercelBlob;

  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (onVercel) {
    logger.warn("media_using_data_url", { folder, reason: "vercel_without_azure_blob" });
    return toDataUrl(file, buffer);
  }

  try {
    return await trySaveToDisk(file, folder, buffer);
  } catch (error) {
    logger.error("disk_upload_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return toDataUrl(file, buffer);
  }
}

export async function saveCoverFile(file: File): Promise<StoredImage> {
  return saveImageFile(file, "covers");
}

export async function saveInlineImage(file: File): Promise<StoredImage> {
  return saveImageFile(file, "inline");
}

/** Monta URL assinada para leitura de um blob Azure (path relativo covers/... ou azure:covers/...). */
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
