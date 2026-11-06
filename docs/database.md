# Database — Central de Comunicação Interna

## Schema

`comunicacao` — `APP_DB_SCHEMA` + Prisma `@@schema`. Tabelas desta app **não** ficam em `dbo`.

## Entidades

| Tabela | Função |
| --- | --- |
| users / user_roles | Projeção Entra; papéis `COLLABORATOR` / `COMMUNICATOR` (String) |
| communication_categories | Categorias evolutivas (incl. newsletter) |
| communications | Comunicado; status/prioridade String; `audienceType=ALL` |
| communication_targets | Reserva de segmentação (MVP vazio) |
| communication_reads | Visualização (único user+comunicado) |
| push_subscriptions | Endpoint por dispositivo; `endpointHash` único (índice SQL) |
| notifications | Sino in-app |
| notification_deliveries | Log de canal |
| audit_events | Ciclo de vida |

Índices: status+publishedAt, reads unique, subscriptions user+active.

## Local

`docker compose up -d` → database `comunicacao-interna_dev` → `prisma migrate deploy` → `prisma db seed`.

Seed fictício: 10 colaboradores, 2 comunicadores, categorias, 10 comunicados, uma leitura, subscription inativa de teste.

`SEED_ENTRA_OBJECT_ID` + `SEED_ADMIN_EMAIL` projetam o usuário real de dev como comunicador.

## Produção

Azure SQL compartilhado, permissão só neste schema. `prisma migrate deploy` com aprovação.

## Migrations

1. `20240917000000_init` — users
2. `20240917180000_communications` — domínio
