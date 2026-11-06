# ADR 006 — Estratégia de notificações (multi-canal)

## Status

Aceito

## Contexto

Há dois canais no MVP (in-app e Web Push) e canais futuros (e-mail, Teams). Product exige que publicação não fique colada a um transport.

## Decisão

Serviço `publishCommunication` gera um **evento de publicação**. Fan-out explícito:

1. Persistência in-app (`notifications`)
2. Envio Web Push (`notification_deliveries` + `web-push`)
3. Pontos de extensão futuros no mesmo serviço (não implementados)

In-app e Push **não** são a mesma tabela. Delivery log registra canal, resultado e erro seguro (sem payload sensível).

## Consequências

- 400 in-app rows por publicação é aceitável.
- Falha de push não desfaz a publicação (publicar é a transação de negócio; delivery é melhor esforço + log).
- E-mail/Teams exigirão novo adapter, não novo “jeito de publicar”.
