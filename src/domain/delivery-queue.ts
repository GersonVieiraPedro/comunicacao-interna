import { CommunicationPriority } from "@/types/communication";

export type FanoutPhase = "in_app" | "push";

export type FanoutCursor = {
  phase: FanoutPhase;
  /** Offset estável na lista ordenada de subscriptions (fase push). */
  offset: number;
};

/** In-app sempre. Push só para importante/urgente (alinhado ao editor). */
export function shouldSendWebPush(priority: string | null | undefined): boolean {
  return (
    priority === CommunicationPriority.IMPORTANT || priority === CommunicationPriority.URGENT
  );
}

export const FANOUT_IN_APP_BATCH = 100;
export const FANOUT_PUSH_BATCH = 40;
export const FANOUT_PUSH_CONCURRENCY = 8;
export const FANOUT_MAX_ATTEMPTS = 8;

export function parseFanoutCursor(raw: string | null | undefined): FanoutCursor {
  if (!raw) return { phase: "in_app", offset: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<FanoutCursor>;
    const phase = parsed.phase === "push" ? "push" : "in_app";
    const offset = typeof parsed.offset === "number" && parsed.offset >= 0 ? Math.floor(parsed.offset) : 0;
    return { phase, offset };
  } catch {
    return { phase: "in_app", offset: 0 };
  }
}

export function serializeFanoutCursor(cursor: FanoutCursor): string {
  return JSON.stringify(cursor);
}

/**
 * in_app: se ainda há usuários sem notificação → permanece; senão → push.
 * push: avança offset; se acabou → null (concluído).
 */
export function advanceFanoutCursor(input: {
  cursor: FanoutCursor;
  inAppRemaining: number;
  pushProcessed: number;
  pushTotal: number;
}): FanoutCursor | null {
  const { cursor } = input;
  if (cursor.phase === "in_app") {
    if (input.inAppRemaining > 0) return { phase: "in_app", offset: 0 };
    return { phase: "push", offset: 0 };
  }
  const nextOffset = cursor.offset + input.pushProcessed;
  if (nextOffset < input.pushTotal) return { phase: "push", offset: nextOffset };
  return null;
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]!);
    }
  });
  await Promise.all(runners);
  return results;
}
