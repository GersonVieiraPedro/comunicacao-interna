import { describe, expect, it } from "vitest";
import { createUserSchema, updateProfileSchema } from "@/validations/user";
import { AppRole } from "@/types/roles";

describe("user validation", () => {
  it("aceita cadastro mínimo de colaborador", () => {
    const parsed = createUserSchema.parse({
      email: "pessoa@empresa.com",
      displayName: "Pessoa",
      password: "SenhaForte1",
      roles: [AppRole.COLLABORATOR],
    });
    expect(parsed.email).toBe("pessoa@empresa.com");
  });

  it("exige senha atual para trocar senha no perfil", () => {
    const result = updateProfileSchema.safeParse({
      displayName: "Nome",
      newPassword: "NovaSenha12",
    });
    expect(result.success).toBe(false);
  });
});
