import { describe, expect, it } from "vitest";
import { cleanEnvSecret, cleanVapidSubject } from "@/lib/vapid";

describe("vapid helpers", () => {
  it("remove aspas e espaços das chaves", () => {
    expect(cleanEnvSecret(' "abc_def" ')).toBe("abc_def");
    expect(cleanEnvSecret("ab c\ndef")).toBe("abcdef");
  });

  it("normaliza subject", () => {
    expect(cleanVapidSubject("gerson@metarh.com.br")).toBe("mailto:gerson@metarh.com.br");
    expect(cleanVapidSubject("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(cleanVapidSubject("https://app.example.com")).toBe("https://app.example.com");
  });
});
