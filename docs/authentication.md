# Authentication — Central de Comunicação Interna

## Mecanismo

Microsoft Entra ID via Auth.js. Sem senha da aplicação.

Redirect: `{AUTH_URL}/api/auth/callback/microsoft-entra-id`  
Issuer: `https://login.microsoftonline.com/<tenant-id>/v2.0`  
Optional claim: `groups`

## Papéis

| Valor | Produto | Env |
| --- | --- | --- |
| COLLABORATOR | Colaborador (padrão após login) | — |
| COMMUNICATOR | Comunicador | `AUTH_COMMUNICATOR_GROUP_IDS` (alias `AUTH_ADMIN_GROUP_IDS`) |

Autenticado ≠ autorizado. `/admin` e mutações de comunicado exigem `COMMUNICATOR` no servidor.

## Bypass local (somente desenvolvimento)

Para testes rápidos sem Entra:

1. `AUTH_URL=http://localhost:3000` (ou `127.0.0.1`)
2. `AUTH_DEV_BYPASS=true` em `.env.local`
3. `npm run dev` (`NODE_ENV=development`)

Na tela `/login` aparecem **Entrar como colaborador (local)** e **Entrar como comunicador (local)**. Isso cria usuários estáveis no banco (`local-dev-collaborator` / `local-dev-communicator`) e sessão Auth.js.

Também aceito `AUTH_ALLOW_DEV_LOGIN=true` (nome da fábrica), com as mesmas travas.

## Camadas

- Middleware (`auth.config.ts`, Edge, sem Prisma)
- Layout autenticado chama `auth()`
- Services: `requireUser` / `requireCommunicator`
- Cron: `CRON_SECRET`, sem cookie

Públicas: `/login`, `/api/auth/*`, `/api/health`, `/api/cron/*` (secret), `/sw.js`, `/manifest.webmanifest`, `/icons/*`
