# ADR 004 — SQL Server + Prisma

## Status

Aceito (padrão da Factory)

## Contexto

Produção futura é Azure SQL. Dev local usa SQL Server em Docker. Prisma é o ORM da Factory.

## Decisão

Prisma + SQL Server. Status, papéis e prioridade como `String` + uniões TypeScript (conector sem enum nativo). Migrations versionadas. Nunca `db push` como fluxo oficial.

## Consequências

- Paridade boa com Azure SQL.
- Precisa validar `schemas` no Prisma da versão do template (já adotado no scaffold).
- Busca full-text avançada fica fora; LIKE/contains no MVP.
