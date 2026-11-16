# ADR 009 — Fila de fan-out (delivery jobs)

## Status

Aceito

## Contexto

Publicar sincronamente cria notificações in-app e dispara Web Push para todos os destinatários na mesma request. Com poucos usuários já atrasa a UI; com ~300+ fica inviável no runtime serverless (timeout) e piora a percepção de “publicado”.

Redis/BullMQ exigiria infra extra fora do monólito atual (Vercel + SQL Server).

## Decisão

1. Tabela `delivery_jobs` (schema `comunicacao`) como **fila durável**.
2. Ao publicar: persiste `PUBLISHED` + enfileira `FANOUT_PUBLICATION` e **retorna**.
3. Worker processa em lotes (`in_app` 100 / `push` 40, concorrência 8) com cursor JSON.
4. Disparo do worker: `after()` pós-publish, visitas autenticadas (tick curto), cron `/api/cron/process-delivery-queue` e o cron de agenda.
5. `notifications` ganha unique `(userId, communicationId)` para retries idempotentes (`skipDuplicates`).

## Consequências

- “Publicado” deixa de esperar o fan-out completo; alertas podem chegar segundos depois.
- Hobby (cron raro) depende de `after()` + visitas; Pro/Azure pode chamar o cron com frequência maior.
- Sem Redis no MVP; migração futura para bus externo é possível mantendo o mesmo contrato de job.
