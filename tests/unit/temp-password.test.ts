import { describe, expect, it } from "vitest";
import { isValidNewPassword, tempPasswordForCodigo } from "@/lib/temp-password";

describe("tempPasswordForCodigo", () => {
  it("usa o padrão documentado METARH#codigo", () => {
    expect(tempPasswordForCodigo(12345)).toBe("METARH#12345");
  });
});

describe("isValidNewPassword", () => {
  it("exige letra, número e mínimo 8", () => {
    expect(isValidNewPassword("abcdefg1")).toBe(true);
    expect(isValidNewPassword("short1")).toBe(false);
    expect(isValidNewPassword("nosymbols")).toBe(false);
    expect(isValidNewPassword("12345678")).toBe(false);
  });
});
