/**
 * Schema lógico da aplicação no SQL compartilhado.
 * Único ponto de configuração do nome do schema (além do Prisma schema).
 */
export const databaseConfig = {
  schema: process.env.APP_DB_SCHEMA ?? "comunicacao",
} as const;
