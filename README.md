# Comunicacao Interna

Central de Comunicação Interna — monolito Next.js da Software Factory (PWA + Entra ID + SQL Server).

## Objetivo

Comunicadores publicam avisos institucionais; colaboradores leem no celular (PWA), registram visualização no banco e podem receber Web Push quando o dispositivo permitir.

## Stack

Next.js App Router · React · TypeScript · Tailwind · Prisma · SQL Server · Auth.js / Entra ID · Vitest · Playwright

## Local

```bash
npm install
cp .env.example .env.local
docker compose up -d
# CREATE DATABASE [comunicacao-interna_dev];
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Gere VAPID (`npx web-push generate-vapid-keys`) e preencha as chaves. `AUTH_SECRET` ≥ 16 caracteres.

**Login:** e-mail/senha (JWT Auth.js). Após o seed: `comunicador1@empresa.exemplo` / `SEED_DEFAULT_PASSWORD` (default local `ChangeMe_Comunicacao1`). Entra ID é opcional. Bypass de persona (`AUTH_DEV_BYPASS=true`) só em localhost.

## Papéis

Colaborador (padrão) e Comunicador (`user_roles` / seed).

## Docs

Product, architecture, database, authentication, notifications, pwa, testing, deployment, decisions, security-review.

Produção e migrations destrutivas: aprovação humana.
