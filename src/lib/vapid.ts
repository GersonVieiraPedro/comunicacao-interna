/** Normaliza valores VAPID vindos da Vercel (aspas, espaços, quebras). */
export function cleanEnvSecret(value: string | undefined | null): string {
  return (value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
}

export function cleanVapidSubject(value: string | undefined | null): string {
  const raw = (value ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) return "mailto:comunicacao-interna@localhost";
  if (raw.startsWith("mailto:") || raw.startsWith("https://")) return raw;
  if (raw.includes("@")) return `mailto:${raw}`;
  return "mailto:comunicacao-interna@localhost";
}
