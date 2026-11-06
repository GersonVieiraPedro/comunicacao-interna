# Factory Improvement Opportunities

Registrado durante o MVP Central de Comunicação Interna. **Não alterar a Factory sem aprovação.**

## 1. Bootstrap vs Product

- **Problema:** `create-app` gera código com papéis ADMIN/USER antes do Product.
- **Impacto:** vocabulário errado (admin vs comunicador).
- **Causa:** template único de intranet.
- **Sugestão:** papéis de scaffold documentados como substituíveis.
- **Arquivo:** `scripts/create-app.mjs`, `templates/next-monolith/src/types/roles.ts`

## 2. UI skill desktop-first

- **Problema:** skill UI manda sidebar desktop e “sem identidade nova”; o produto pede PWA mobile-first.
- **Impacto:** risco de desktop encolhido.
- **Sugestão:** variante PWA no skill, mesmo DS.
- **Arquivo:** `.cursor/skills/ui-ux/SKILL.md`

## 3. Pagination do template é só client

- **Problema:** `Pagination` exige `onPageChange`; listas RSC precisam de Link.
- **Sugestão:** variante server com `href`.
- **Arquivo:** `templates/next-monolith/src/components/ui/pagination.tsx`

## 4. Button sem `asChild`

- **Problema:** padrão shadcn `asChild` não existe; Link+Button quebra HTML.
- **Sugestão:** `Button` como Slot ou documentar Link estilizado.
