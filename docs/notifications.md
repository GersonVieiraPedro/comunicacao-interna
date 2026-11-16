# Notificações

Publicação efetiva (agora ou cron) gera um evento de domínio e **enfileira** o fan-out (`delivery_jobs`):

1. Resposta de “publicado” retorna assim que o status e o job estão gravados
2. Worker processa em lotes:
   - **In-app** — sempre (100 usuários por tick)
   - **Web Push** — só se prioridade for **Importante** ou **Urgente** (40 subscriptions/tick, concorrência 8)
3. Futuro: e-mail / Teams no mesmo serviço de fila, não implementado

| Prioridade | In-app | Push |
| --- | --- | --- |
| Normal | sim | não |
| Importante | sim | sim |
| Urgente | sim (+ popup) | sim (mais destaque no SO) |

Workers: `after()` pós-publish, tick em visitas autenticadas, `/api/cron/process-delivery-queue` e o cron de agenda.

Falha de push **não** desfaz a publicação. 410/404 desativa a subscription. Ver ADR 009.

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
