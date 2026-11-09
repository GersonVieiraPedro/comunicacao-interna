import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export type StoredImage = {
  path: string;
  url: string;
  storage: "disk" | "blob" | "data";
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

async function trySaveToBlob(file: File, folder: "covers" | "inline", buffer: Buffer): Promise<StoredImage | null> {
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
      storage: "blob",
    };
  } catch (error) {
    logger.error("blob_upload_failed", {
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

  const blob = await trySaveToBlob(file, folder, buffer);
  if (blob) return blob;

  // Vercel: filesystem da função é read-only (exceto /tmp, que não persiste entre requests).
  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (onVercel) {
    logger.warn("media_using_data_url", { folder, reason: "vercel_without_blob" });
    return toDataUrl(file, buffer);
  }

  try {
    return await trySaveToDisk(file, folder, buffer);
  } catch (error) {
    logger.error("disk_upload_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    // Fallback para não bloquear o editor em ambientes sem disco gravável.
    return toDataUrl(file, buffer);
  }
}

export async function saveCoverFile(file: File): Promise<StoredImage> {
  return saveImageFile(file, "covers");
}

export async function saveInlineImage(file: File): Promise<StoredImage> {
  return saveImageFile(file, "inline");
}

export function coverAbsolutePath(coverPath: string) {
  if (coverPath.startsWith("data:") || coverPath.startsWith("http://") || coverPath.startsWith("https://")) {
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
