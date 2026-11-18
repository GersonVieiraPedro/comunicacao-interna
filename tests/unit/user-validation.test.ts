import { describe, expect, it } from "vitest";
import { createUserSchema, listUsersQuerySchema, updateProfileSchema } from "@/validations/user";
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

  it("normaliza filtros da lista admin com defaults seguros", () => {
    const parsed = listUsersQuerySchema.parse({
      q: " 12345 ",
      page: "2",
      role: AppRole.CANDIDATE,
      push: "yes",
      source: "erp",
    });
    expect(parsed.q).toBe("12345");
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(25);
    expect(parsed.status).toBe("all");
    expect(parsed.role).toBe(AppRole.CANDIDATE);
    expect(parsed.push).toBe("yes");
    expect(parsed.source).toBe("erp");
  });

  it("rejeita pageSize acima do limite", () => {
    const result = listUsersQuerySchema.safeParse({ pageSize: 500 });
    expect(result.success).toBe(false);
  });
});
