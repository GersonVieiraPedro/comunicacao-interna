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

Testes sem Entra (somente `next dev` + localhost): em `.env.local` defina `AUTH_DEV_BYPASS=true`. Em `/login`, use **Entrar como colaborador (local)** ou **Entrar como comunicador (local)**. O banco local precisa estar no ar. Não use essa flag em produção.

## Papéis

Colaborador (padrão) e Comunicador (grupo Entra `AUTH_COMMUNICATOR_GROUP_IDS`).

## Docs

Product, architecture, database, authentication, notifications, pwa, testing, deployment, decisions, security-review.

Produção e migrations destrutivas: aprovação humana.
