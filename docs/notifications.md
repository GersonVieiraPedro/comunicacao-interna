# Notificações

Publicação efetiva (agora ou cron) gera um evento de domínio e faz fan-out:

1. **In-app** — uma linha em `notifications` por usuário provisionado
2. **Web Push** — `web-push` + VAPID para `push_subscriptions.active`
3. Futuro: e-mail / Teams no mesmo serviço, não implementado

Falha de push **não** desfaz a publicação. 410/404 desativa a subscription.

## Texto (MVP)

Título: Nova comunicação interna  
Corpo: Confira o novo comunicado publicado.  
Clique: `/comunicados/{id}`

## Permissão

Convite após o primeiro acesso (não no primeiro pixel). “Agora não” não entra em loop. Configurações permitem tentar de novo.

## Limitações (não mascarar)

| Ambiente | Expectativa |
| --- | --- |
| Android Chrome / Edge | Melhor caminho |
| Desktop Chrome / Edge | Geralmente ok |
| iOS/iPadOS | PWA na Tela de Início + iOS 16.4+; Safari na aba não é equivalente |
| Safari desktop | Comportamento limitado; orientar o usuário |

Teste real de entrega push depende de HTTPS, chaves VAPID e um browser compatível. O E2E deste MVP **não** afirma que o SO mostrou a notificação.
