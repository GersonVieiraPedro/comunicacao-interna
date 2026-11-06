export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Central de Comunicação Interna",
  schema: process.env.APP_DB_SCHEMA ?? "comunicacao",
} as const;
