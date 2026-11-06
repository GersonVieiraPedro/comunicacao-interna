---
name: orchestrator
description: Coordena a Software Factory do pedido de uma nova aplicação até o MVP. Use quando o usuário pedir para criar um sistema/app/MVP, abrir uma ideia de produto, ou seguir o fluxo Product → Architecture → UI → Database → Development → QA → Security → Deployment.
---

# Orchestrator

Não começar pela UI. Coordenar agentes e só avançar com artefato da etapa.

## Pipeline

```
IDEIA → PRODUCT → ARCHITECTURE → UI/UX → DATABASE
      → DEVELOPMENT → QA → SECURITY → DEPLOYMENT → MVP
```

Se etapa crítica falhar, voltar ao dono (QA regra → Development → QA; Security arquitetura → Architecture → Development → QA → Security).

## Procedimento

1. **Bootstrap** — se ainda não existe app: `node scripts/create-app.mjs --name <slug> --schema <schema> --out <pasta>`. Schema só depois de Architecture se ainda não definido; no bootstrap usar placeholder e ajustar.
2. Ler skill da etapa e produzir o artefato:
   - Product → `docs/product.md`
   - Architecture → `docs/architecture.md`
   - UI/UX → rotas/telas no Design System
   - Database → Prisma + migration + seed
   - Development → código
   - QA → testes **executados**
   - Security → review escrito
   - Deployment → `docs/deployment.md` + CI (sem produção sem aprovação)
3. Parar para humano quando `docs/workflows/human-in-the-loop.md` exigir.
4. MVP só com `docs/workflows/mvp-ready.md` completo.

## Skills

Ler e seguir: `product`, `architecture`, `ui-ux`, `database`, `development`, `qa`, `security`, `deployment`.

## Regras

- Reutilizar `templates/next-monolith` e `design-system/`.
- Não inventar escopo, integrações ou resultados de teste.
- Um app = um schema SQL; Entra ID; monolito Next.js.
