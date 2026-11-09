# Authentication — Central de Comunicação Interna

## Mecanismo (piloto)

Login **interno**: e-mail + senha via Auth.js Credentials, sessão **JWT**.

- Sem senha em texto no banco (`passwordHash` bcrypt).
- Sem auto-cadastro na UI — contas criadas por seed / admin.
- Entra ID **opcional** se `AUTH_MICROSOFT_ENTRA_ID_*` estiver preenchido.

Redirect Auth.js: `{AUTH_URL}/api/auth/callback/...`  
Issuer Entra (se usado): `https://login.microsoftonline.com/<tenant-id>/v2.0`

## Papéis

| Valor | Produto | Como recebe |
| --- | --- | --- |
| COLLABORATOR | Colaborador | Padrão em todo usuário |
| COMMUNICATOR | Comunicador | Seed / role no banco (`user_roles`) |

Autenticado ≠ autorizado. `/admin` e mutações exigem `COMMUNICATOR` no servidor.

## Contas de seed

Defina `SEED_DEFAULT_PASSWORD` (ou use o default só em local). Exemplos:

- `comunicador1@empresa.exemplo` → comunicador
- `colaborador1@empresa.exemplo` → colaborador

Produção: `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` no seed, depois **troque a senha**.

## Bypass local (somente desenvolvimento)

1. `AUTH_URL=http://localhost:3000`
2. `AUTH_DEV_BYPASS=true` em `.env.local`
3. `npm run dev`

Botões de persona local **sem senha**. Proibido em produção.

## Camadas

- Middleware (`auth.config.ts`, Edge)
- Layout autenticado chama `auth()`
- Services: `requireUser` / `requireCommunicator`
- Cron: `CRON_SECRET`

Públicas: `/login`, `/api/auth/*`, `/api/health`, `/api/cron/*` (secret), `/sw.js`, `/manifest.webmanifest`, `/icons/*`

Ver ADR `docs/decisions/008-auth-interno-jwt.md`.
