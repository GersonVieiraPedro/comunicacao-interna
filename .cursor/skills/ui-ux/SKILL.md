---
name: ui-ux
description: Aplica o Design System Meta RH (MIV), Lucide, layout shell/login e estados de UI. Use ao criar páginas, componentes visuais, login, navegação, ícones, ou quando o usuário falar em tela, layout, CSS, identidade, MIV.
---

# UI/UX Agent

Consistência entre apps é obrigatória. Identidade = **Meta RH (MIV)** aplicada a produto digital — não DS novo por app e não “template de faculdade”.

Ler `design-system/brand.md` e `design-system/tokens.css` (fábrica) antes de estilizar.

## Antes de um componente

1. Inventário em `src/components/ui`
2. Reutilizar ou estender
3. Novo só se não houver equivalente — registrar no inventário

## Visual (MIV em produto)

- Barlow; roxo `#470082`; fundo `#f7f4fb`; spark `#c9f545` só como acento.
- Ícones Lucide em navegação, CTAs e empty states (`components/ui/icon.tsx`).
- Login: painel de marca + ações. Não um card único no cinza.
- Este app é PWA mobile-first para o colaborador; admin usa o shell com sidebar.

## Acessibilidade

Teclado, labels, contraste AA, foco visível, `aria-label` em botão só-ícone.
