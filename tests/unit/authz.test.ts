import { describe, expect, it } from "vitest";
import { ForbiddenError, UnauthorizedError, toPublicError } from "@/lib/errors";
import { requireRole, requireUser } from "@/lib/authz";
import { AppRole } from "@/types/roles";

describe("erros públicos", () => {
  it("expõe AppError conhecido", () => {
    expect(toPublicError(new UnauthorizedError())).toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("esconde erro desconhecido", () => {
    expect(toPublicError(new Error("stack interna"))).toMatchObject({
      status: 500,
      message: "Ocorreu um erro. Tente novamente.",
    });
  });
});

describe("authz", () => {
  const user = {
    id: "1",
    email: "a@b.c",
    name: "A",
    roles: [AppRole.COLLABORATOR],
  };

  it("exige sessão", () => {
    expect(() => requireUser(undefined)).toThrow(UnauthorizedError);
  });

  it("bloqueia papel insuficiente", () => {
    expect(() => requireRole(user, [AppRole.COMMUNICATOR])).toThrow(ForbiddenError);
  });
});
