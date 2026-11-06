# Architecture — Central de Comunicação Interna

## Contexto

MVP da **Central de Comunicação Interna** (`apps/comunicacao-interna`), primeiro produto real para validar a Software Factory. Product: `docs/product.md`. Não há Express. Um processo Next.js serve UI, Server Actions, Route Handlers e jobs HTTP de agendamento.

Público ~400 colaboradores; comunicadores são subconjunto. Canal futuro (e-mail, Teams) não entra no runtime atual, mas o evento de publicação não fica acoplado a um único transport.

## Stack (padrão da fábrica)

| Camada | Escolha |
| --- | --- |
| UI | Next.js App Router, React, TypeScript, Tailwind, Design System (`design-system/` + `src/components/ui`) |
| Backend | Server Components, Server Actions, Route Handlers; `services/` + `repositories/` |
| ORM / SQL | Prisma + SQL Server; produção futura Azure SQL; schema `comunicacao` |
| Auth | Auth.js + Microsoft Entra ID |
| PWA | Manifest da app + service worker (push + cache conservador) |
| Web Push | Push API + biblioteca `web-push` (VAPID) |
| Rich text | Editor maduro (TipTap) + HTML sanitizado no servidor |
| Storage | Porta `FileStorage`; implementação local no MVP |
| Hosting alvo | Vercel (validação); container `standalone` permanece no template para Azure |
| Testes | Vitest + Playwright |

Desvio de papéis do scaffold (`ADMIN`/`USER`): papéis de **domínio** `COLLABORATOR` e `COMMUNICATOR` (ver AuthZ e ADR de papéis implícito em Riscos). Express: não.

## Estrutura

```
apps/comunicacao-interna/
  prisma/          schema, migrations, seed
  public/          ícones PWA, SW se estático
  src/app/         rotas (auth, colaborador, admin, api)
  src/components/  UI da fábrica + compostos do produto
  src/features/    communications, notifications, push, pwa
  src/services/    regras (publicação, leitura, métricas, fan-out)
  src/repositories/
  src/lib/         authz, errors, sanitizer, push, logger
  src/config/      app, database schema, env
  src/types/       status, priority, roles (uniões TS; SQL = String)
  src/validations/
  tests/
  docs/
```

Configuração do schema SQL **centralizada** (`src/config/database.ts` + `@@schema` no Prisma). Queries não repetem o nome do schema.

## Domínio

Agregado principal: **Communication** (comunicado institucional: notícia, aviso, newsletter como categoria, evento, etc.).

```
Publication (serviço)
  → persiste status PUBLICADO
  → AuditEvent
  → NotificationEvent (in-memory / registro de log)
       ├─ In-app Notification (persistida por usuário)
       └─ Web Push (subscriptions ativas)
       └─ (futuro) Email / Teams
```

Módulos:

| Feature | Responsabilidade |
| --- | --- |
| identity | User, papéis, sync Entra |
| communications | ciclo de vida, busca, métricas |
| reads | visualização binária |
| notifications | sino in-app |
| push | subscriptions + envio VAPID |
| media | capa via FileStorage |
| pwa | manifest, SW, install UX |

**Público:** campo `audienceType = ALL` no comunicado. Tabela `communication_targets` reservada (vazia no MVP) para departamento/unidade/grupo sem retrabalho de modelo. Nenhuma query do MVP filtra alvo além de ALL.

**Newsletter:** `category.slug = newsletter` (ou categoria seed). Sem motor de e-mail.

## Banco (schema, isolation)

- Schema lógico: **`comunicacao`** (já definido no bootstrap; padrão fábrica `schema_<app>`). Não usar `dbo` para tabelas desta app.
- Dev: Docker SQL Server do template; database `comunicacao-interna_dev`; testes em instância/db separados.
- Produção: um Azure SQL compartilhado da fábrica; credencial **somente** neste schema.
- Enums Prisma: **não**. Status, prioridade, papéis, audience, canais: `String` + constantes TypeScript.
- Arquivos: **fora** do SQL (URL/path na linha do comunicado).
- Leituras e métricas: derivadas (`COUNT` de users × `communication_reads`), sem contador denormalizado obrigatório no MVP.

Modelo lógico (nomes físicos em `docs/database.md` na etapa Database):

- `users`, `user_roles`
- `communication_categories`
- `communications`
- `communication_targets` (futuro; MVP sem linhas)
- `communication_reads` (único por par usuário–comunicado; `firstViewedAt`; opcional `lastViewedAt`, `viewCount`)
- `push_subscriptions`
- `notifications` (in-app)
- `notification_deliveries` (log de canal: `IN_APP` \| `WEB_PUSH`; status sent/failed)
- `audit_events`
- `media_objects` (opcional se a capa precisar de metadados; senão `coverPath` na communication)

Índices previstos: status+publishedAt; categoryId; authorId; reads (userId, communicationId unique); notifications (userId, createdAt); subscriptions (userId, endpoint unique, active).

## AuthN / AuthZ (papéis, rotas)

### AuthN

Padrão do template: `auth.config.ts` (Edge, sem Prisma) + `auth.ts` (Node, sync User). Cookies de sessão Auth.js. Falha clara se `AUTH_SECRET` / Entra env faltarem.

### Papéis (substitui ADMIN/USER do scaffold)

| Produto | Valor persistido | Entra |
| --- | --- | --- |
| Colaborador | `COLLABORATOR` | grupos `AUTH_COLLABORATOR_GROUP_IDS` ou padrão pós-login |
| Comunicador | `COMMUNICATOR` | grupos `AUTH_COMMUNICATOR_GROUP_IDS` |

`COMMUNICATOR` inclui capacidades de colaborador no código (`hasCommunicator` / `hasCollaborator`).

Compatibilidade: se ainda existirem env `AUTH_ADMIN_GROUP_IDS` / `AUTH_USER_GROUP_IDS` no template, mapear na implementação para os novos nomes **ou** aceitar os antigos como alias documentado — sem dois sistemas de papel.

### Rotas

Públicas: `/login`, `/auth/*`, `/api/auth/*`, `GET /api/health`, assets PWA (`/manifest.webmanifest`, service worker, ícones).

Protegidas (sessão): home, comunicados, histórico, configurações, sino, APIs de negócio, `/admin/*`.

`/admin/**`: papel `COMMUNICATOR` no **layout e em cada Server Action/service**. Colaborador recebe 403, não vazamento de rascunhos.

Cron: `POST /api/cron/publish-scheduled` autenticado por `CRON_SECRET` (não por cookie de usuário).

## APIs / Server Actions

Preferir Server Actions para mutações de página (criar, publicar, marcar lido). Route Handlers quando o cliente não é um form RSC: Push subscription, upload, cron, health.

| Contrato | AuthZ | Notas |
| --- | --- | --- |
| `GET /api/health` | público | liveness |
| `GET/POST /api/auth/*` | Auth.js | |
| `GET /api/me` | usuário | papéis |
| Server Actions communications | comunicador | CRUD, publish, schedule, cancel schedule |
| Server Action `acknowledgeRead` | colaborador | idempotente |
| `POST/DELETE /api/push/subscriptions` | colaborador | upsert por endpoint |
| `POST /api/media/cover` | comunicador | multipart; tipo/tamanho |
| `POST /api/cron/publish-scheduled` | cron secret | publica AGENDADO devido |
| `GET /api/push/vapid-public-key` | sessão | ou expor só `NEXT_PUBLIC_*` da chave **pública** VAPID |

Payloads de lista paginados. Sem N+1: reads agregados em query de métricas (`groupBy` / SQL count).

## Integrações (somente as pedidas)

- Microsoft Entra ID
- Web Push (endpoint do browser; VAPID)
- Filesystem local (dev) → futuro Azure Blob (mesma porta)
- Agendador HTTP (Vercel Cron na validação; o mesmo endpoint em outro host)

Sem Graph para e-mail, sem Teams, sem IdP extra.

## PWA

- `display: standalone`, `start_url` autenticável (`/` ou `/login` com redirect pós-login)
- Ícones, `name` / `short_name`, theme tokens do DS
- SW: (1) evento `push` / `notificationclick` (obrigatório); (2) cache **estáticos** e precaução para não cachear HTML autenticado de forma stale
- Mobile-first: bottom nav no colaborador; admin pode manter shell da fábrica em viewports largos e compactar no mobile
- Detecção de suporte: `serviceWorker` in navigator, `PushManager`, `Notification`; iOS só após “Adicionar à Tela de Início” (16.4+) — UI honesta

## Web Push

- Biblioteca: **`web-push`** no servidor Node
- Chaves VAPID em env; **privada nunca** `NEXT_PUBLIC_`
- Subscription: `userId`, `endpoint`, `p256dh`, `auth`, timestamps, `active`
- 410/404 no endpoint → `active = false`
- Payload mínimo: título/corpo padrão Product + `communicationId` + URL
- Envio síncrono no request de publicar é aceitável para ~400–1200 subscriptions; se estourar timeout do host, extrair para o mesmo cron “drain outbox” — não introduzir Kafka. Timeout Vercel: risco documentado (ver Riscos)

## Agendamento

Comunicador grava `status = AGENDADO` + `scheduledPublishAt`.

Processo: **cron HTTP** a cada minuto (Vercel Cron) chama o Route Handler, que em transação promove devidos para PUBLICADO e dispara o mesmo serviço de publicação (notificações). Idempotente.

Não há worker separado no MVP. Relógio: UTC no banco; UI em fuso da empresa (documentar `America/Sao_Paulo` na UI).

## Storage

```
FileStorage.save(kind, file) → { path, contentType }
FileStorage.getUrl(path)
```

Dev: disco sob diretório ignorado pelo Git / fora de `public` se exigir auth para servir (Route Handler autenticado). Produção futura: Blob. Não servir upload aberto sem sessão.

## Deployment

- CI: lint, typecheck, test, build (GitHub Actions do template)
- Vercel: env, cron, SQL Server acessível da Vercel (rede/firewall) — **bloqueio real** se o SQL for só VNet; documentar e não fingir deploy
- Azure SQL + App Service/Container: caminho da fábrica (`docs/deployment.md`)
- Migration: `prisma migrate deploy` com aprovação humana
- Sem produção neste ciclo sem HITL

## Riscos e decisões

| Risco | Mitigação |
| --- | --- |
| Prisma `schemas` × SQL Server | Já usado no template; validar migrate local antes de features |
| Timeout ao enviar 1000 pushes no publish | Fan-out no request; se falhar CI/prod, outbox + cron; sem fila externa |
| iOS Web Push | Documentar; UX de “não suportado até instalar PWA” |
| Token Entra `groups` overage | Mesmo risco do template; grupos de comunicador devem ser poucos |
| XSS no HTML do editor | Sanitizar no servidor (allowlist); CSP do template se existir |
| SQL injection | Só Prisma |
| VAPID / AUTH secrets | `.env.example` sem valores; fail-fast |
| Papéis scaffold vs domínio | Substituir ADMIN/USER; não manter os dois significados |
| Factory UI skill “desktop-first” vs Product mobile-first | Respeitar Product; DS igual; ver Factory Improvement |

ADRs: `docs/decisions/`.

## Factory Improvement Opportunity

| | |
| --- | --- |
| **Problema** | Skill UI/UX da Factory pede layout sidebar desktop e “sem identidade nova”; este produto exige mobile-first, PWA standalone e bottom nav, ainda na mesma família visual. |
| **Impacto** | Agente UI pode gerar “desktop encolhido” se seguir só o skill. |
| **Causa** | Padrão dos MVPs anteriores é intranet desktop. |
| **Sugestão** | Estender o skill UI com variante “PWA colaborador / mobile-first” sem novo DS. Não alterar a Factory neste ciclo. |
| **Arquivo** | `.cursor/skills/ui-ux/SKILL.md`, `docs/standards/design-system.md` |
