# ADR 003 — Backend no Next.js (sem Express)

## Status

Aceito

## Contexto

A Factory padroniza monolito Next.js. O produto não tem integração que exija processo HTTP separado.

## Decisão

Toda regra de negócio roda no processo Next: Server Actions, Route Handlers, serviços. **Express não** entra neste MVP.

## Consequências

- Um deploy, um modelo de auth.
- Limites de tempo da plataforma (Vercel) afetam fan-out de push e cron — mitigar com job HTTP idempotente se necessário.
- Se no futuro um worker longo for obrigatório, isso vira ADR novo — não um Express “porque sim”.
