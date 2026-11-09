/** Limites de mídia compartilhados (UI + API). */
export const IMAGE_LIMITS = {
  /** Tamanho máximo do arquivo selecionado pelo usuário. */
  maxUploadBytes: 10 * 1024 * 1024,
  maxUploadLabel: "10 MB",
  /** Payload seguro para functions (Vercel ~4,5 MB). O cliente comprime antes se passar disso. */
  maxWireBytes: 3.5 * 1024 * 1024,
  maxWireLabel: "3,5 MB",
  allowedMime: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedLabel: "JPEG, PNG ou WebP",
  coverMaxEdge: 1920,
  inlineMaxEdge: 1600,
  outputFormat: "image/webp" as const,
  outputExt: "webp" as const,
  outputQuality: 80,
  userHint:
    "Até 10 MB (JPEG, PNG ou WebP). O sistema comprime e redimensiona automaticamente para melhor performance.",
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
