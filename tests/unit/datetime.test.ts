import { afterEach, describe, expect, it, vi } from "vitest";
import { assertFutureDate, parseDateTimeLocalInput } from "@/lib/datetime";

describe("parseDateTimeLocalInput", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aceita ISO com Z", () => {
    const date = parseDateTimeLocalInput("2026-11-09T18:00:00.000Z");
    expect(date.toISOString()).toBe("2026-11-09T18:00:00.000Z");
  });

  it("no servidor interpreta naive como America/Sao_Paulo (UTC-3)", () => {
    vi.stubGlobal("window", undefined);
    const date = parseDateTimeLocalInput("2026-11-09T15:00");
    expect(date.toISOString()).toBe("2026-11-09T18:00:00.000Z");
  });

  it("rejeita valor vazio", () => {
    expect(() => parseDateTimeLocalInput("  ")).toThrow("EMPTY_DATETIME");
  });
});

describe("assertFutureDate", () => {
  it("permite margem de 30s", () => {
    const now = new Date("2026-11-09T12:00:00.000Z");
    expect(() => assertFutureDate(new Date("2026-11-09T12:00:20.000Z"), now)).not.toThrow();
    expect(() => assertFutureDate(new Date("2026-11-09T11:59:00.000Z"), now)).toThrow("SCHEDULE_IN_PAST");
  });
});
