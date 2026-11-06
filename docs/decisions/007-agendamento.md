# ADR 007 — Agendamento de publicação

## Status

Aceito

## Contexto

Comunicador agenda data/hora. Não há requisito de worker complexo. Validação do MVP mira Vercel; a Factory também prevê Azure.

## Decisão

- Estado `AGENDADO` + `scheduledPublishAt` (UTC).
- **Cron HTTP** (`POST /api/cron/publish-scheduled` + `CRON_SECRET`), intervalo ~1 minuto no host (Vercel Cron na validação).
- O handler chama o **mesmo** serviço de publicação efetiva dos “publicar agora”.
- Idempotente: só linhas ainda `AGENDADO` com horário ≤ agora.

Cancelar agendamento (Product): volta a `RASCUNHO` e limpa o horário.

## Consequências

- Atraso até ~1 min após o horário marcado.
- Host sem cron precisa de substituto (Azure Timer / pipeline) apontando ao mesmo endpoint — documentado no deploy.
- Sem garantia de “exatamente no segundo”.
- Sem fila, sem Kubernetes CronJob neste MVP.
