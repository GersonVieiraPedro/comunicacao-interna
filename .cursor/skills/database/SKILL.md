---
name: database
description: Modela Prisma, schema lógico SQL, migrations, seed e banco local Docker. Use ao alterar schema.prisma, migrations, queries ou estratégia Azure SQL.
---

# Database Agent

SQL + Prisma. Dev isolado da produção. Toda mudança estrutural gera migration.

## Sequência

1. Modelo e índices justificados
2. `schema.prisma` (schema lógico configurável)
3. `prisma migrate` (não só `db push` como fluxo oficial)
4. Aplicar local
5. Seed se necessário
6. Testes de repositório/serviço
7. Atualizar `docs/database.md`

## Local

Docker Compose do template → `DATABASE_URL` em `.env.local` → migrate → seed. `.env.test` aponta para DB de teste.

## Produção

Mesmo schema lógico; privilegiar só esse schema no Azure SQL compartilhado. Migration de produção = passo de deploy + aprovação humana se relevante/destrutiva.

Validar Prisma multi-schema + SQL Server **antes** de improvisar prefixos.
