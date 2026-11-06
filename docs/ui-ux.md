# UI/UX — Central de Comunicação Interna

Decisões de interface **antes** da implementação. Tokens, Barlow, Lucide e login de marca vêm do Design System Meta RH da Factory (`design-system/brand.md`). Identidade do produto = nome, hierarquia e PWA — não um DS novo.

Princípio: **projetar o colaborador no mobile primeiro**; desktop amplia. Admin usa o shell corporativo (sidebar + header) e compacta no mobile (tabela → lista, sem grid financeiro).

## Sitemap

```
/login                         público
/                              home colaborador (protegido)
/comunicados/[id]              detalhe
/historico                     listagem + filtros + busca
/notificacoes                  centro in-app
/configuracoes                 push, instalação PWA, conta
/admin                         dashboard comunicador
/admin/comunicados             lista
/admin/comunicados/novo        editor (criar)
/admin/comunicados/[id]        detalhe admin + métricas
/admin/comunicados/[id]/editar editor
```

Deep link de push: `/comunicados/[id]` (sessão expirada → login → returnUrl).

## Navegação

### Colaborador — mobile (< md)

- Top bar curta: marca (nome curto **Central**), sino (badge), avatar/menu
- **Bottom navigation:** Início · Histórico · Alertas · Mais
- Sem sidebar persistente
- Áreas de toque ≥ 44px; evitar tabela

### Colaborador — desktop (≥ md)

- AppShell da Factory: sidebar (Início, Histórico, Notificações, Configurações; se comunicador: Admin)
- Header: busca global (atalho para histórico com `q=`), sino, usuário
- Conteúdo max-width confortável para leitura (~720px no detalhe; home pode usar coluna + destaque)

### Comunicador — `/admin`

- Mesmo AppShell; item Admin em evidência
- Mobile: lista em cards empilhados, não tabela larga
- Editor: uma coluna; ações Recuar / Rascunho / Agendar / Publicar no rodapé sticky mobile

## Fluxos de tela

1. **Login** — painel de marca Meta RH + Entra e, em localhost, perfis local (colaborador / comunicador).
2. **Home** — destaque (1) + lista “Últimos”; se R5: Modal do DS com o comunicado não lido (capa, categoria, título, resumo, prioridade, Entendi, Ver depois, Abrir).
3. **Detalhe** — capa, meta, HTML sanitizado, voltar.
4. **Histórico** — busca, chips/select de categoria, período, switch não lidos, paginação.
5. **Sino** — lista; tocar abre detalhe e marca notificação in-app como lida (visualização do comunicado só se abrir o conteúdo).
6. **Configurações** — estado de permissão (concedida / negada / não suportado / iOS precisa instalar); botão Ativar; texto iOS.
7. **Admin dashboard** — números simples (sem gráficos de marketing).
8. **Admin lista** — filtros + ações.
9. **Editor** — campos Product + TipTap; preview sanitizado opcional na mesma página.

## Componentes

Reutilizar: Button, Input, Select, Textarea, Table, Modal, Dropdown, Badge, Alert, Card, EmptyState, Skeleton, Spinner, Pagination, Breadcrumbs, AppShell, Header, Sidebar, PageHeader.

**Novos (justificados; registrar no inventário do app):**

| Composto | Por que não o DS puro |
| --- | --- |
| `BottomNav` | PWA colaborador; o shell não tem nav inferior |
| `CommunicationCard` | Card de conteúdo com capa + não lido; ainda usa `Card` + `Badge` |
| `PriorityMark` | Ponto/label urgente com cor `danger` do token, sem neon |
| `UnreadCommunicationModal` | Composição de `Modal` |
| `NotificationBell` | Dropdown/sheet do sino |
| `PushPrompt` | Alert + ações; uma vez |
| `RichTextEditor` / `RichText` | TipTap + viewer sanitizado |
| `InstallHint` | Empty/Alert de instalação |

## Estados

- Loading: Skeleton na home/lista; Spinner em submit
- Vazio: EmptyState (“Nenhum comunicado publicado”)
- Erro: Alert destructive; `error.tsx` do template
- Sem permissão: página simples 403 (não menu mentiroso)
- Push não suportado: Alert informativo, nunca toast infinito
- Foco visível: tokens de focus do DS
- Popup: `role="dialog"`, foco preso, ESC = Ver depois (não marca lido)

## Visual de prioridade

- normal: sem badge extra
- importante: Badge neutro/warning do DS (“Importante”)
- urgente: Badge danger (“Urgente”) + borda esquerda token danger no card — só isso

## Conteúdo rico

Tipografia do DS no viewer. Imagens do editor `max-width: 100%`. Links com sublinhado e `rel` seguro.

## Acessibilidade

Teclado no modal e no editor; labels nos filtros; contraste dos badges; `aria-current` na bottom nav; sino com `aria-label` e contagem.
