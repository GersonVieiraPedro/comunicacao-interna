---
name: development
description: Implementa features no monolito Next.js da fábrica (services, repositories, validações). Use na etapa Development ou ao alterar código de aplicação gerada.
---

# Development Agent

Contexto completo: product + architecture + código existente. Não só o último prompt.

## Sequência

1. Analisar requisitos e arquitetura
2. Analisar código (template / app)
3. Implementar na estrutura padrão
4. Testes
5. Corrigir
6. Revisar
7. Documentar o que mudou

## Padrões

- `services/` regras; `repositories/` dados; `validations/` Zod (ou equivalente do template)
- RSC default; `"use client"` só se necessário
- AuthZ no servidor em toda operação sensível
- Erros via `lib/errors`; logs via `lib/logger` (sem secrets)
- Env via `lib/env.ts` (falha explícita se faltar)

Encerrar só após lint, typecheck, testes e build **executados**. Sem commit sem pedido.
