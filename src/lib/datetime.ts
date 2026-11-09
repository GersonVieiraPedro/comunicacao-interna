/**
 * Converte valor de <input type="datetime-local"> (sem fuso) para Date em UTC.
 * No browser: interpreta como horário local do usuário.
 * No servidor (Vercel = UTC): se vier sem offset, assume America/Sao_Paulo (UTC-3).
 */
export function parseDateTimeLocalInput(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("EMPTY_DATETIME");
  }
  // Já em ISO com fuso
  if (/Z$/i.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_DATETIME");
    return parsed;
  }

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) {
    const fallback = new Date(trimmed);
    if (Number.isNaN(fallback.getTime())) throw new Error("INVALID_DATETIME");
    return fallback;
  }

  const [, y, mo, d, h, mi, s = "00"] = match;

  // Browser: Date.parse de "YYYY-MM-DDTHH:mm" = horário local
  if (typeof window !== "undefined") {
    const local = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s),
    );
    if (Number.isNaN(local.getTime())) throw new Error("INVALID_DATETIME");
    return local;
  }

  // Servidor: datetime-local do Brasil → UTC-3 (sem horário de verão desde 2019)
  const withOffset = `${y}-${mo}-${d}T${h}:${mi}:${s}-03:00`;
  const parsed = new Date(withOffset);
  if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_DATETIME");
  return parsed;
}

export function assertFutureDate(date: Date, now = new Date(), skewMs = 30_000): void {
  if (date.getTime() <= now.getTime() - skewMs) {
    throw new Error("SCHEDULE_IN_PAST");
  }
}

export function formatBrazilDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
