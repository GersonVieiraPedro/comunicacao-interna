# ADR 005 — Schema SQL por aplicação

## Status

Aceito

## Contexto

A Factory prevê um Azure SQL compartilhado com um schema lógico por app. O usuário sugeriu `comunicacao` ou equivalente.

## Decisão

Usar **`comunicacao`** (não `schema_comunicacao`). Todas as tabelas deste produto neste schema. Não criar objetos em `dbo` para o domínio.

Nome configurável (`APP_DB_SCHEMA` / Prisma `@@schema`), nunca espalhado em queries.

## Consequências

- Isolamento por schema na instância compartilhada.
- Credencial de produção deve ter privilégio só neste schema.
- Se Prisma/SQL Server impedir `@@schema` em alguma versão, registrar fallback (prefixo) **antes** de improvisar — o template já usa `@@schema`.
