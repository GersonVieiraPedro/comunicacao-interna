# Deployment — Central de Comunicação Interna

## Alvo de validação: Vercel (piloto)

- Root Directory na Vercel: `apps/comunicacao-interna` (se o repo for a Software Factory) **ou** a raiz do repo (se subir só este app).
- Build: `npm install` → `prisma generate` (postinstall) → `next build`.
- Env: copiar de `.env.example` — **nunca** versionar `.env` / `.env.local`.
- Cron: `vercel.json` chama `/api/cron/publish-scheduled` **1×/dia** (`0 12 * * *` UTC) — limite do plano Hobby. Header `Authorization: Bearer $CRON_SECRET`. Para publicar agendados quase em tempo real: plano Pro (`* * * * *`) ou ping externo no mesmo endpoint.
- SQL Server precisa ser alcançável da Vercel (firewall Azure SQL / IP público). Se o Azure SQL for só VNet, este caminho **não** sobe sem rede.
- Web Push e PWA exigem **HTTPS** (Vercel já entrega).
- Capas em disco (`uploads/`): no filesystem da Vercel são **efêmeras**. Para piloto, evite depender de capas persistentes; Blob/Storage fica para depois.

## Banco

Dev: Docker SQL Server (`docker-compose.yml`).  
Piloto/produção: Azure SQL (ou SQL alcançável), schema **`comunicacao`**, `npx prisma migrate deploy` **após** o primeiro release (ou no job de release), com aprovação humana.

```bash
# Com DATABASE_URL de produção apontando para o Azure SQL:
npx prisma migrate deploy
```

## Auth

Padrão: e-mail/senha (JWT Auth.js). Após migrate: `npx prisma db seed` com `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`.

Entra (opcional): redirect `https://<dominio>/api/auth/callback/microsoft-entra-id`.

**Proibido em produção:** `AUTH_DEV_BYPASS` / `AUTH_ALLOW_DEV_LOGIN`.

## Variáveis obrigatórias na Vercel

| Variável | Notas |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Nome exibido |
| `APP_DB_SCHEMA` | `comunicacao` |
| `DATABASE_URL` | Azure SQL / SQL alcançável |
| `AUTH_SECRET` | ≥ 16 chars |
| `AUTH_URL` | URL HTTPS do deploy |
| `SEED_DEFAULT_PASSWORD` / `SEED_ADMIN_*` | Só no job de seed (não precisa na Vercel runtime) |
| `AUTH_MICROSOFT_ENTRA_ID_*` | Opcional — login interno é o padrão |
| `WEB_PUSH_VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` |
| `WEB_PUSH_VAPID_PRIVATE_KEY` | idem |
| `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` | mesma pública |
| `WEB_PUSH_SUBJECT` | `mailto:...` |
| `CRON_SECRET` | bearer do cron |
| `AZURE_BLOB_TOKEN` | URL do container Blob com SAS (upload/leitura de imagens). Sem isso na Vercel, imagens caem em data URL. |

## Celular (PWA)

1. Abrir a URL HTTPS no Chrome (Android) ou Safari (iOS).
2. Login Entra (conta do tenant).
3. Android: **Instalar a Central** (um toque) se o Chromium oferecer.
4. iOS: Compartilhar → Adicionar à Tela de Início (Apple não permite install API).
5. Push: só após instalar/atalho + permissão; iOS exige atalho na Tela de Início.
6. Ícone atual é SVG — em alguns iPhones o atalho fica genérico até haver PNG 180/192/512 (melhoria futura).

## CI

`.github/workflows/ci.yml`: lint, typecheck, test, build. Sem deploy automático de produção.

## Checklist antes de sincronizar Vercel

- [ ] `.gitignore` ok; nenhum `.env` / secret no Git
- [ ] Repo remoto criado; Root Directory correto na Vercel
- [ ] Env na Vercel preenchida (tabela acima)
- [ ] Firewall SQL libera a Vercel (ou IP necessário)
- [ ] `prisma migrate deploy` no schema `comunicacao`
- [ ] Redirect URI Entra = URL do deploy
- [ ] VAPID gerado e `NEXT_PUBLIC_*` alinhado
- [ ] `CRON_SECRET` definido
- [ ] Sem `AUTH_DEV_BYPASS` / `AUTH_ALLOW_DEV_LOGIN` na Vercel
- [ ] Smoke no celular: login → feed → (opcional) instalar PWA
- [ ] Aprovação humana para produção “de verdade”
