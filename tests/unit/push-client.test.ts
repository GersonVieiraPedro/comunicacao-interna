import { describe, expect, it } from "vitest";
import { cleanPublicVapidKey } from "@/lib/push-client";

describe("push-client", () => {
  it("limpa aspas da chave pública", () => {
    expect(cleanPublicVapidKey(' "BLvh6I8g" ')).toBe("BLvh6I8g");
  });
});
