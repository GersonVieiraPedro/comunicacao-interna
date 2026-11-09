import { IMAGE_LIMITS } from "@/lib/image-limits";

export function MediaLimitsHint({ variant = "cover" }: { variant?: "cover" | "inline" }) {
  const maxEdge = variant === "cover" ? IMAGE_LIMITS.coverMaxEdge : IMAGE_LIMITS.inlineMaxEdge;
  return (
    <p className="text-xs leading-relaxed text-fg-muted">
      Limite de envio: <strong className="font-semibold text-fg">{IMAGE_LIMITS.maxUploadLabel}</strong> (
      {IMAGE_LIMITS.allowedLabel}). Lado máximo após otimização:{" "}
      <strong className="font-semibold text-fg">{maxEdge}px</strong>. O servidor comprime para WebP
      automaticamente para melhorar performance e armazenamento.
    </p>
  );
}
