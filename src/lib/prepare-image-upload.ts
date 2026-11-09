"use client";

import { IMAGE_LIMITS, formatBytes } from "@/lib/image-limits";

/**
 * Prepara arquivo para upload: valida tipo/tamanho e comprime no browser
 * se passar do limite de rede (functions).
 */
export async function prepareImageUpload(file: File): Promise<File> {
  if (!IMAGE_LIMITS.allowedMime.includes(file.type as (typeof IMAGE_LIMITS.allowedMime)[number])) {
    throw new Error(`Formato inválido. Use ${IMAGE_LIMITS.allowedLabel}.`);
  }
  if (file.size > IMAGE_LIMITS.maxUploadBytes) {
    throw new Error(`Arquivo com ${formatBytes(file.size)}. Máximo: ${IMAGE_LIMITS.maxUploadLabel}.`);
  }
  if (file.size <= IMAGE_LIMITS.maxWireBytes) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxEdge = IMAGE_LIMITS.coverMaxEdge;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Não foi possível preparar a imagem neste navegador.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let blob: Blob | null = null;
  while (quality >= 0.55) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= IMAGE_LIMITS.maxWireBytes) break;
    quality -= 0.08;
  }

  if (!blob) {
    throw new Error("Não foi possível comprimir a imagem. Tente outro arquivo.");
  }
  if (blob.size > IMAGE_LIMITS.maxWireBytes) {
    throw new Error(
      `Mesmo após comprimir ficou em ${formatBytes(blob.size)}. Reduza a resolução e tente de novo.`,
    );
  }

  const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
