# Backlog — Central de Comunicação Interna

Atualizado: **2026-11-09**  
App: `apps/comunicacao-interna` · Deploy piloto: Vercel Hobby  
Auth atual: **e-mail/senha interno (Auth.js JWT)**; Entra ID opcional/futuro.

Legenda de status: `feito` · `em andamento` · `a fazer` · `pós-MVP`

---

## Resumo executivo

| Situação | Epics | Nota |
| --- | --- | --- |
| **Feitas** | E1–E11 | Núcleo do MVP entregue e em uso no piloto |
| **Em andamento** | E12, E13 | Qualidade de fechamento + endurecimento do piloto |
| **Falta para finalizar o projeto** | E14–E17 | Go-live sustentável (mídia, jobs, HITL, E2E auth) |
| **Pós-MVP (fora do fechamento)** | E18+ | Segmentação, Entra obrigatório, canais extras, BI |

---

## Epics feitas

### E1 — Identidade, papéis e sessão
**Status:** feito  
**Valor:** só quem tem conta no app entra; comunicador ≠ colaborador.

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E1.1 | Login interno e-mail/senha (JWT) | Login funciona em produção piloto; senha hasheada | feito |
| E1.2 | Papéis `COLABORADOR` / `COMUNICADOR` | AuthZ no servidor (services/APIs); `/admin` bloqueado sem papel | feito |
| E1.3 | Seed / reset de usuários operacionais | Contas iniciais criáveis via seed/scripts | feito |
| E1.4 | Entra ID como provedor único | Original do product; substituído no piloto por auth interno | feito* (descontinuado no MVP piloto) |

\*Produto original previa só Entra; decisão operacional do piloto: auth interno. Reativação Entra = E18.

### E2 — Modelo de comunicado + persistência
**Status:** feito

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E2.1 | Schema Prisma `comunicacao` + migrations | Tabelas versionadas; app sobe com migrate | feito |
| E2.2 | Categorias seed | Categorias listáveis no editor | feito |
| E2.3 | CRUD rascunho | Criar/editar rascunho com validação | feito |

### E3 — Publicar, agendar e expirar
**Status:** feito (com limitação de cron Hobby documentada)

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E3.1 | Publicar agora | Status PUBLICADO + fan-out in-app (+ push via API) | feito |
| E3.2 | Agendar com timezone correto | `datetime-local` → ISO (dispositivo / BRT no server) | feito |
| E3.3 | Cancelar agendamento → rascunho | Editável de novo | feito |
| E3.4 | Expiração automática | Some da home ativa quando `expiresAt` passou | feito |
| E3.5 | Publicação oportunística de vencidos | Qualquer visita autenticada processa due (mitiga cron 1×/dia) | feito |
| E3.6 | Cron Vercel | Job diário Hobby + secret | feito (frequência limitada) |

### E4 — Home colaborador, detalhe e leitura
**Status:** feito

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E4.1 | Home com destaque / últimos / não lidos | Feed autenticado | feito |
| E4.2 | Detalhe do comunicado | Conteúdo sanitizado + capa | feito |
| E4.3 | `CommunicationRead` | Visualização gravada no servidor | feito |

### E5 — Popup de não visualizado
**Status:** feito

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E5.1 | Um popup por visita à home | Ordem urgente → importante → normal → recente | feito |
| E5.2 | Entendi / Ver depois | Persiste ou adia conforme regra Product | feito |

### E6 — Histórico, busca e filtros
**Status:** feito

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E6.1 | Histórico colaborador | PUBLICADO/EXPIRADO | feito |
| E6.2 | Filtros e busca SQL | Campos definidos no product | feito |

### E7 — Admin: lista, editor, dashboard e agenda
**Status:** feito

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E7.1 | Lista admin com filtros | Status, categoria, data de agenda | feito |
| E7.2 | Dashboard (totais + menor taxa) | Métricas derivadas do banco | feito |
| E7.3 | Editor rico profissional | Cabeçalho/corpo/rodapé; negrito, fonte, listas, alinhamento, link, imagem | feito |
| E7.4 | Agenda de publicações | `/admin/agenda` lista agendados; revisar/editar | feito |
| E7.5 | Métricas por comunicado | Elegíveis / lidos / % | feito |

### E8 — Notificações in-app
**Status:** feito

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E8.1 | Fan-out no publicar | Itens no sino | feito |
| E8.2 | Marcar lida / abrir comunicado | Centro de alertas | feito |

### E9 — PWA
**Status:** feito (ícones PNG ainda pendentes em E14)

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E9.1 | Manifest + SW + standalone | Instalável Android; atalho iOS | feito |
| E9.2 | Nav mobile (bottom) + shell desktop | Layout fábrica | feito |

### E10 — Web Push
**Status:** feito (polimento residual em E13)

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E10.1 | VAPID + subscription por device | Ativar nas configurações | feito |
| E10.2 | Prompt não agressivo | UX de ativação com feedback | feito |
| E10.3 | Push na publicação | Via `/api/push/dispatch` (runtime confiável na Vercel) | feito |
| E10.4 | Push no agendamento efetivado | Fan-out no job/oportunístico | feito |
| E10.5 | Teste admin de broadcast | Botão de teste para validar dispositivo | feito |

### E11 — Capa / mídia
**Status:** feito no piloto (persistência durável = E14)

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E11.1 | Upload capa + imagens inline | JPEG/PNG/WebP ≤ 2 MB; sanitizado | feito |
| E11.2 | Servir via `/api/media` autenticado | Path confinado | feito |

---

## Epics em andamento

### E12 — Qualidade de fábrica (fechamento)
**Status:** em andamento  
**Objetivo:** poder declarar o MVP “validado pela Factory” sem dívida silenciosa.

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E12.1 | Testes unitários de regras/auth/sanitize/datetime/editor HTML | Suíte Vitest verde | feito |
| E12.2 | Integração Prisma (quando há `DATABASE_URL`) | Conecta no banco de teste | feito |
| E12.3 | E2E públicos (login visível, redirect anônimo, health/manifest) | Playwright básico | parcial |
| E12.4 | E2E autenticados (publicar, popup, leitura, agenda) | Fluxos críticos cobertos com usuário de teste | a fazer |
| E12.5 | Atualizar `docs/product.md` / security para auth interno | Docs alinhados ao que está em produção | a fazer |
| E12.6 | Lint + typecheck + build no CI | Pipeline verde no GitHub | feito |

### E13 — Endurecimento do piloto (push, UX, ops)
**Status:** em andamento  
**Objetivo:** reduzir fricção do que já está no ar.

| ID | Item | Aceite | Status |
| --- | --- | --- | --- |
| E13.1 | Som / não-silencioso no SO | Tag única + urgency high; documentar limite de Focus/iOS | parcial |
| E13.2 | Texto do push com título/resumo do comunicado | Payload usa título/resumo reais (não só genérico) | parcial* |
| E13.3 | Gestão simples de usuários no admin | Comunicador cria/edita/ativa colaborador; perfil/senha em Configurações | feito |
| E13.4 | Checklist operacional de seed/reset pós-deploy | Doc passo a passo no `deployment.md` | a fazer |
| E13.5 | Revisão humana do piloto (HITL de uso real) | Feedback de 1 comunicador + N colaboradores | a fazer |
| E13.6 | Observabilidade entrega/visão/ciência | Recebeu, visualizou, abriu notificação, confirmou ciência; dashboard e detalhe admin | feito |

\*Código de fan-out já envia título/resumo; validar em todos os caminhos (teste admin vs publicação).

---

## Epics que faltam para finalizar o projeto

Escopo de **fechamento do MVP / go-live sustentável** (não features de produto novas).

### E14 — Infra de mídia e PWA “produção”
**Status:** a fazer

| ID | Item | Aceite | Prioridade |
| --- | --- | --- | --- |
| E14.1 | Storage persistente (Azure Blob ou equivalente) | Capas/imagens sobrevivem redeploy Vercel | alta |
| E14.2 | Ícones PWA PNG 180 / 192 / 512 | Atalho iOS/Android com ícone da marca | média |
| E14.3 | Política de retenção / limpeza de uploads órfãos | Doc + rotina mínima | baixa |

### E15 — Agendamento confiável em tempo quase real
**Status:** a fazer

| ID | Item | Aceite | Prioridade |
| --- | --- | --- | --- |
| E15.1 | Cron ≤ 1 min **ou** worker externo | Publicação na janela acordada sem depender de visita | alta |
| E15.2 | Observabilidade do job (log/métrica published/expired) | Falha do cron visível | média |
| E15.3 | Manter publish oportunístico como rede de segurança | Continua mesmo com cron Pro | média |

### E16 — Segurança e go-live (HITL)
**Status:** a fazer

| ID | Item | Aceite | Prioridade |
| --- | --- | --- | --- |
| E16.1 | Security review atualizado (auth interno, upload, push) | Doc + veredito; sem secrets no repo | alta |
| E16.2 | Checklist produção preenchido | Env, SQL firewall, VAPID, sem `AUTH_ALLOW_DEV_LOGIN` | alta |
| E16.3 | Aprovação humana explícita de go-live | Registro em HITL / PR | alta |
| E16.4 | Plano de backup/restore do schema `comunicacao` | Responsável + frequência | média |

### E17 — Aceite formal do MVP
**Status:** a fazer

| ID | Item | Aceite | Prioridade |
| --- | --- | --- | --- |
| E17.1 | Roteiro de aceite Product (publicar → ler → métrica → push) | Executado e assinado pelo dono do produto | alta |
| E17.2 | Débitos explícitos no backlog (não “sumidos”) | Só resta E18+ ou itens marcados | alta |
| E17.3 | README / runbook do app para operação | Quem opera sabe publicar, agendar e resetar senha | média |

---

## Pós-MVP (não bloqueia finalização)

| ID | Epic / item | Notas |
| --- | --- | --- |
| E18 | Entra ID corporativo (SSO) como padrão | Voltar ao desenho original do product |
| E19 | Segmentação de audiência (departamento/unidade) | Modelo já preparado (`audience`); UI/regras depois |
| E20 | Despublicar / arquivar publicado | Fora do MVP atual |
| E21 | E-mail / Teams / canais extras | Evento de domínio já existe; canais novos |
| E22 | Texto/template custom de push por comunicado | Além do título/resumo |
| E23 | App nativo | Fora de escopo |
| E24 | BI / dashboards avançados | Fora de escopo |
| E25 | Multi-tenant | Fora de escopo |

---

## Ordem sugerida para fechar o projeto

1. **E13.3 + E13.4** — operação de usuários sem script  
2. **E12.4 + E12.5** — E2E auth + docs alinhados  
3. **E14.1** — Blob (senão capas somem no redeploy)  
4. **E15.1** — cron confiável  
5. **E16 + E17** — security, HITL, aceite formal  

---

## Mapa rápido (legado F1–F12 → epics)

| Fatia antiga | Epic | Situação |
| --- | --- | --- |
| F1 | E1 | feito (auth interno no piloto) |
| F2 | E2 | feito |
| F3 | E3 | feito |
| F4 | E4 | feito |
| F5 | E5 | feito |
| F6 | E6 | feito |
| F7 | E7 | feito (+ agenda + editor TipTap) |
| F8 | E8 | feito |
| F9 | E9 | feito |
| F10 | E10 | feito |
| F11 | E11 | feito (storage local) |
| F12 | E12–E17 | em andamento / a fazer para finalizar |
