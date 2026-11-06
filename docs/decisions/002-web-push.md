# ADR 002 — Web Push

## Status

Aceito

## Contexto

O colaborador deve ser avisado com o app **fechado**, via notificação do SO/navegador, não só um sino interno.

## Decisão

Usar **Web Push** (Push API + Notifications API + VAPID) com a biblioteca Node **`web-push`**. Persistir `PushSubscription` por dispositivo. Chave pública VAPID pode ser exposta ao cliente; a privada só no servidor.

## Consequências

- Android Chrome/Edge e desktop Chromium: caminho mais previsível.
- iOS/iPadOS: PWA instalado + permissão; Safari desktop tem restrições próprias — documentar, não mascarar.
- Dependência de endpoints Google/Apple/Mozilla; 410 desativa subscription.
- Sem FCM SDK proprietário além do que o próprio browser usa.
