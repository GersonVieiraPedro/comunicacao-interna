import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  APP_DB_SCHEMA: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url(),
  AUTH_DEV_BYPASS: z.enum(["true", "false"]).optional().default("false"),
  AUTH_ALLOW_DEV_LOGIN: z.enum(["true", "false"]).optional().default("false"),
  AUTH_MICROSOFT_ENTRA_ID_ID: z.string().optional().default(""),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: z.string().optional().default(""),
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: z.string().optional().default(""),
  AUTH_COMMUNICATOR_GROUP_IDS: z.string().optional().default(""),
  AUTH_COLLABORATOR_GROUP_IDS: z.string().optional().default(""),
  AUTH_ADMIN_GROUP_IDS: z.string().optional().default(""),
  AUTH_USER_GROUP_IDS: z.string().optional().default(""),
  WEB_PUSH_VAPID_PUBLIC_KEY: z.string().optional().default(""),
  WEB_PUSH_VAPID_PRIVATE_KEY: z.string().optional().default(""),
  WEB_PUSH_SUBJECT: z.string().optional().default("mailto:comunicacao-interna@localhost"),
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: z.string().optional().default(""),
  CRON_SECRET: z.string().optional().default(""),
  FILE_STORAGE_DIR: z.string().optional().default("uploads"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;
  // Referências estáticas: o bundler de Server Actions da Vercel só injeta envs
  // mencionadas como process.env.NOME_LITERAL (não via process.env genérico).
  const parsed = schema.safeParse({
    ...process.env,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    APP_DB_SCHEMA: process.env.APP_DB_SCHEMA,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_DEV_BYPASS: process.env.AUTH_DEV_BYPASS,
    AUTH_ALLOW_DEV_LOGIN: process.env.AUTH_ALLOW_DEV_LOGIN,
    WEB_PUSH_VAPID_PUBLIC_KEY: process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
    WEB_PUSH_VAPID_PRIVATE_KEY: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
    WEB_PUSH_SUBJECT: process.env.WEB_PUSH_SUBJECT,
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    FILE_STORAGE_DIR: process.env.FILE_STORAGE_DIR,
  });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${JSON.stringify(fields)}`);
  }
  cached = parsed.data;
  if (
    cached.NODE_ENV === "production" &&
    (cached.AUTH_DEV_BYPASS === "true" || cached.AUTH_ALLOW_DEV_LOGIN === "true")
  ) {
    throw new Error("Login local (AUTH_DEV_BYPASS / AUTH_ALLOW_DEV_LOGIN) não pode ser true em produção.");
  }
  // Auth padrão: e-mail/senha (Credentials + JWT). Entra ID permanece opcional.
  return cached;
}

export function parseGroupIds(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function communicatorGroupIds(env: Env = getEnv()): string[] {
  return parseGroupIds(env.AUTH_COMMUNICATOR_GROUP_IDS || env.AUTH_ADMIN_GROUP_IDS);
}

export function collaboratorGroupIds(env: Env = getEnv()): string[] {
  return parseGroupIds(env.AUTH_COLLABORATOR_GROUP_IDS || env.AUTH_USER_GROUP_IDS);
}
