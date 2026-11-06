# Security review (MVP)

Data: 2026-09-17  
Escopo: código da Central em `apps/comunicacao-interna`.

## AuthN / AuthZ

- Entra ID only; papéis no servidor (`requireCommunicator`)
- Middleware não é a única camada; layout admin + services
- Cron separado por secret (timingSafeEqual)
- `/api/media` exige sessão; path confinada ao diretório de storage

## Secrets

- `.env.example` sem valores reais
- VAPID privada só server-side
- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` é pública por desenho

## XSS / HTML

- `sanitize-html` allowlist no save e no viewer
- `dangerouslySetInnerHTML` só após sanitize

## Upload

- JPEG/PNG/WebP, 2 MB; não vai para o SQL

## Pendências honestas

- Sem tenant Entra neste ambiente, login real não foi exercitado
- Push real não foi observado neste ciclo
- HITL: mapear grupos Entra de comunicador antes de produção

## Veredito

Risco residual aceitável para MVP de validação da Factory, **não** para go-live sem preenchimento de env, HTTPS e revisão humana de Entra.
