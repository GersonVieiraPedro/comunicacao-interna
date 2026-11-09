import { describe, expect, it } from "vitest";
import { credentialsSubject, hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("normaliza subject de credenciais", () => {
    expect(credentialsSubject(" Ana@Empresa.COM ")).toBe("cred:ana@empresa.com");
  });

  it("hash e verify", async () => {
    const hash = await hashPassword("ChangeMe_Comunicacao1");
    expect(hash).not.toContain("ChangeMe");
    expect(await verifyPassword("ChangeMe_Comunicacao1", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
