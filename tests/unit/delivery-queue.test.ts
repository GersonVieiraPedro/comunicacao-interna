import { describe, expect, it } from "vitest";
import {
  advanceFanoutCursor,
  mapPool,
  parseFanoutCursor,
  serializeFanoutCursor,
  shouldSendWebPush,
} from "@/domain/delivery-queue";
import { CommunicationPriority } from "@/types/communication";

describe("delivery queue cursor", () => {
  it("parseia cursor inválido como início in_app", () => {
    expect(parseFanoutCursor(null)).toEqual({ phase: "in_app", offset: 0 });
    expect(parseFanoutCursor("nope")).toEqual({ phase: "in_app", offset: 0 });
  });

  it("serializa e parseia round-trip", () => {
    const cursor = { phase: "push" as const, offset: 80 };
    expect(parseFanoutCursor(serializeFanoutCursor(cursor))).toEqual(cursor);
  });

  it("avança in_app enquanto houver pendentes", () => {
    expect(
      advanceFanoutCursor({
        cursor: { phase: "in_app", offset: 0 },
        inAppRemaining: 50,
        pushProcessed: 0,
        pushTotal: 0,
      }),
    ).toEqual({ phase: "in_app", offset: 0 });
  });

  it("passa para push quando in_app acabou", () => {
    expect(
      advanceFanoutCursor({
        cursor: { phase: "in_app", offset: 0 },
        inAppRemaining: 0,
        pushProcessed: 0,
        pushTotal: 10,
      }),
    ).toEqual({ phase: "push", offset: 0 });
  });

  it("conclui push ao cobrir todas as subscriptions", () => {
    expect(
      advanceFanoutCursor({
        cursor: { phase: "push", offset: 40 },
        inAppRemaining: 0,
        pushProcessed: 40,
        pushTotal: 80,
      }),
    ).toBeNull();
  });
});

describe("shouldSendWebPush", () => {
  it("envia push só para importante e urgente", () => {
    expect(shouldSendWebPush(CommunicationPriority.NORMAL)).toBe(false);
    expect(shouldSendWebPush(CommunicationPriority.IMPORTANT)).toBe(true);
    expect(shouldSendWebPush(CommunicationPriority.URGENT)).toBe(true);
  });
});

describe("mapPool", () => {
  it("respeita concorrência e preserva ordem dos resultados", async () => {
    const started: number[] = [];
    const result = await mapPool([1, 2, 3, 4], 2, async (n) => {
      started.push(n);
      await new Promise((resolve) => setTimeout(resolve, 20 - n));
      return n * 10;
    });
    expect(result).toEqual([10, 20, 30, 40]);
    expect(started).toHaveLength(4);
  });
});
