export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly expose = true,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos") {
    super(message, "VALIDATION", 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Não encontrado") {
    super(message, "NOT_FOUND", 404);
  }
}

export function toPublicError(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof AppError && error.expose) {
    return { status: error.status, code: error.code, message: error.message };
  }
  return { status: 500, code: "INTERNAL", message: "Ocorreu um erro. Tente novamente." };
}
