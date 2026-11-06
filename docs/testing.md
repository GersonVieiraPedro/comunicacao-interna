# Testing

## Unitário (Vitest)

Regras de publicação/visibilidade, popup, métricas, papéis, sanitização XSS, authz.

## Integração

`tests/integration/db.test.ts` — só corre se `DATABASE_URL` existir. Não inventar verde sem banco.

## E2E (Playwright)

- Login Entra visível
- Anônimo em `/` e `/admin` → login
- Health, manifest, service worker

Fluxos autenticados (popup, publicar, marcar lido) **exigem tenant Entra** e não foram simulados com senha local. Sem sessão de teste, não declarar esses E2E como executados.

## Responsivo

Playwright desktop no CI local da app. Viewports mobile devem ser reexecutados quando houver servidor com auth.

## Comandos

`npm test` · `npm run test:e2e` · `npm run lint` · `npm run typecheck` · `npm run build`
