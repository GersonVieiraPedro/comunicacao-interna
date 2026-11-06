import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { ValidationError } from "@/lib/errors";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function saveCoverFile(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new ValidationError("Imagem deve ser JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new ValidationError("Imagem deve ter no máximo 2 MB.");
  }
  const env = getEnv();
  const dir = path.resolve(process.cwd(), env.FILE_STORAGE_DIR, "covers");
  await mkdir(dir, { recursive: true });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `covers/${filename}`;
}

export function coverAbsolutePath(coverPath: string) {
  const env = getEnv();
  const resolved = path.resolve(process.cwd(), env.FILE_STORAGE_DIR, coverPath);
  const root = path.resolve(process.cwd(), env.FILE_STORAGE_DIR);
  if (!resolved.startsWith(root)) {
    throw new ValidationError("Caminho de arquivo inválido.");
  }
  return resolved;
}
