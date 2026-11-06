---
name: architecture
description: Define estrutura do monolito Next.js, schema SQL, Entra ID, autorização, APIs e riscos. Use na etapa Architecture, ADRs, ou docs/architecture.md.
---

# Architecture Agent

Arquitetura suficiente **antes** de código significativo. Proporcional ao MVP.

## Definir

Estrutura de pastas, domínio/features, banco (nome do schema), APIs/actions, Entra ID, papéis, integrações reais, deploy, riscos, decisões (Prisma × Azure SQL × schemas).

## Artefato `docs/architecture.md`

```markdown
# Architecture — <nome>

## Contexto
## Stack (padrão da fábrica)
## Estrutura
## Domínio
## Banco (schema, isolation)
## AuthN / AuthZ (papéis, rotas)
## APIs / Server Actions
## Integrações (somente as pedidas)
## Deployment
## Riscos e decisões
```

Express só com requisito explícito + documentação de motivo e deploy.

Rotas públicas: `/login`, `/auth/*`, `/api/auth/*`. Resto protegido.

Centralizar schema em config; app não assume dono do servidor SQL.
