# Product — Central de Comunicação Interna

**App:** `comunicacao-interna`  
**Hipótese:** central única autenticada para comunicados MetaRH, com quatro perfis (METARH, Cliente, Colaborador, Candidato), segmentação no disparo e canais institucionais (redes, site, YouTube, CS, FAQ, pesquisas, Selecty).  
**Status Product:** evoluído (ADR-010 — perfis e audiência filtrada).  
**Premissas:** auth interno no piloto (Entra opcional); atributos de contrato/RH no banco local até existir sync; URLs institucionais alinhadas a metarh.com.br / Selecty.

## Problema

Comunicados e canais institucionais se espalham (e-mail, WhatsApp, site, portal de vagas). Cada público (time MetaRH, cliente, alocado, candidato) precisa de um acesso coerente: o que ver, com quem falar e quais links oficiais usar. Sem segmentação, o disparo atinge “todo mundo” ou ninguém certo.

## Público

| Persona | Quem é | Necessidade principal |
| --- | --- | --- |
| **METARH** | Time interno com acesso completo | Disparar comunicados com filtros, ver performance, ajustar contratos/atributos de usuários |
| **Cliente** | Contato da empresa contratante | Ver comunicados dos alocados; CS (WhatsApp/e-mail); redes; NPS/CSAT |
| **Colaborador** | Pessoa com contrato ativo alocada | Comunicados, FAQ, links úteis, contato por e-mail, pesquisas |
| **Candidato** | Sem contrato ativo (automático) | Redes oficiais + vagas Selecty |

Papéis persistidos: `METARH` | `CLIENT` | `COLLABORATOR` | `CANDIDATE` (`COMMUNICATOR` legado → `METARH`).

## Objetivos

1. Centralizar publicação e consumo de comunicados institucionais.
2. Garantir que comunicado publicado e ainda não visualizado seja apresentado ao colaborador ao entrar.
3. Registrar visualização no servidor (fonte da verdade).
4. Permitir aviso no sistema operacional via Web Push quando o dispositivo/navegador e a permissão permitirem.
5. Validar a Software Factory com um produto que ~400 pessoas poderiam usar de fato.

**Métrica de sucesso do MVP (qualitativa + simples):** um comunicador publica; colaboradores autenticados veem, registram leitura e (em ambiente compatível) recebem push. Comunicador vê % de visualização.

## Funcionalidades (MVP)

### Autenticação e acesso

- Login Auth.js (interno no piloto; Entra opcional)
- Quatro perfis com menus e homes distintos
- METARH: `/admin` (disparo, filtros, painel, usuários/contratos)
- Cliente / Colaborador / Candidato: superfícies de consumo conforme matriz (sem `/admin`)
- Redes, site e YouTube visíveis em todos os perfis

### Comunicado

- Criar, editar, rascunho, publicar, agendar, cancelar agendamento
- Categorias iniciais (evolutivas): Notícias, Comunicados, Eventos, Institucional, Pessoas, Tecnologia, RH, Newsletter, Outros
- Prioridade: normal, importante, urgente
- Capa (arquivo via storage abstrato; local no desenvolvimento)
- Conteúdo rico (título, subtítulo, parágrafos, listas, links, imagens, destaques)
- Status: RASCUNHO, AGENDADO, PUBLICADO, EXPIRADO, CANCELADO
- Público: `ALL` ou `FILTERED` (Ativo/Inativo, Tipo de Contrato, Grupo Econômico, CNPJ, Plano de Saúde, Cartão de Reembolso, pessoa)

Newsletter no MVP = **tipo/categoria de comunicado**, não plataforma de e-mail.

### Consumo

- Home mobile-first: destaque, últimos, indicadores de não lido e prioridade
- Histórico com filtro (categoria, período, só não visualizados) e busca (título, resumo, conteúdo) via SQL
- Popup/modal automático do comunicado não visualizado elegível
- Registro de primeira visualização no banco
- Centro de notificações in-app (sino)

### PWA e Web Push

- Manifest, ícones, service worker, instalação, display standalone
- Subscription por dispositivo, ligada ao usuário
- Prompt de permissão **não agressivo** + tela de configurações
- Push ao publicar (e ao efetivar agendamento), com deep link para o comunicado
- Orientação clara quando o ambiente não suporta (em especial iOS)

### Admin

- Lista de comunicados com filtros
- Dashboard simples: totais por status, visualizações, menor taxa de leitura
- Métricas por comunicado: elegíveis, visualizados, não visualizados, %

### Qualidade mínima

- Design System da fábrica + identidade só por nome, ícone e uso controlado da cor
- Acessibilidade básica (teclado, labels, foco, contraste, estados)
- Auditoria dos eventos de ciclo de vida do comunicado e da visualização
- Seed fictício para desenvolvimento

## Fluxos

### Feliz — colaborador

1. Acessa o app → Entra ID → home.
2. Se houver comunicado publicado, vigente, destinado a todos, ainda não visualizado: o sistema apresenta **um** popup (regra de prioridade abaixo).
3. Colaborador lê e confirma (abre o detalhe ou “Entendi”) → visualização gravada no banco.
4. Home e sino deixam de tratar aquele item como não visualizado.
5. Opcionalmente ativa notificações; em dispositivo compatível, publicações futuras chegam como Web Push.
6. Consulta histórico, busca e filtros.

### Feliz — comunicador

1. Entra ID → `/admin`.
2. Cria comunicado → rascunho → publica (ou agenda data/hora).
3. Na publicação efetiva: colaboradores passam a ver o item; quem tem subscription ativa pode receber Web Push; in-app registra o evento.
4. Vê métricas de leitura.

### Erro / borda

- Não autenticado: só rotas públicas de login/auth; demais redirecionam.
- Sem papel de comunicador: `/admin` e mutações admin recusam no servidor (não só no menu).
- Publicar sem título ou conteúdo inválido: erro de validação.
- Agendamento no passado: recusar.
- Push falhou / 410 gone: subscription desativada; app continua funcionando.
- Navegador sem Push: UI explica e aponta instalação/configurações; não finge que enviou.
- Comunicado expirado: some da home “ativa”; permanece no histórico se já foi publicado e a política de histórico permitir (ver regras).
- Upload de capa inválido (tipo/tamanho): recusa com mensagem clara.

### Sem permissão

- Colaborador não cria/edita/publica.
- Comunicador não altera papéis de outros usuários no MVP (fora de escopo de produto; seed/operação).

## Requisitos

- Stack da Software Factory: Next.js App Router monolito, TypeScript, Tailwind, Prisma, SQL Server (Azure SQL no futuro), Entra ID.
- Um schema SQL próprio da aplicação.
- Autorização em toda operação sensível no servidor.
- PWA real + Web Push (VAPID); não notificação “só dentro da página”.
- Fonte da verdade de leitura: banco, não cookie/localStorage.
- Conteúdo rico sanitizado; imagens fora do banco.
- Busca SQL simples; sem Elasticsearch.
- Testes unitários das regras, integração do domínio persistido, E2E dos fluxos críticos.
- Sem deploy de produção neste ciclo sem aprovação humana.

## Regras de negócio

### R1 — Papéis

- Papéis: `METARH`, `CLIENT`, `COLLABORATOR`, `CANDIDATE`.
- Só `METARH` acessa `/admin` e mutações de comunicado/usuários.
- Sem contrato ativo → perfil efetivo `CANDIDATE` (exceto papel `METARH` / `CLIENT` explícito).
- Middleware/proxy **não** é a única proteção.

### R2 — Ciclo de vida

| De | Para | Quem / como |
| --- | --- | --- |
| (novo) | RASCUNHO | Comunicador salva |
| RASCUNHO | PUBLICADO | Comunicador publica agora |
| RASCUNHO | AGENDADO | Comunicador define `publishedAt` futuro |
| AGENDADO | PUBLICADO | Job/processo de agendamento na data, ou “publicar agora” |
| AGENDADO | CANCELADO | Comunicador cancela agendamento (volta a não ser visível ao colaborador) |
| AGENDADO | RASCUNHO | Comunicador cancela agendamento e continua editando (equivalente prático: CANCELADO não; preferir retorno a RASCUNHO ao cancelar agenda **ainda não publicada**) |
| PUBLICADO | EXPIRADO | Automático quando `expiresAt` passou (se preenchido) |
| RASCUNHO / AGENDADO | CANCELADO | Comunicador desiste do conteúdo |

**Decisão Product:** cancelar um **agendamento** devolve o comunicado para **RASCUNHO** (continua editável). **CANCELADO** é o fim explícito (não volta à home). Comunicado **já publicado** não é “apagado”; o MVP **não** inclui despublicar em massa. Expiração encerra a vigência.

### R3 — Visibilidade para o colaborador

Um comunicado é **elegível para consumo** se:

- status = PUBLICADO (EXPIRADO não entra na home “ativa”)
- `publishedAt` ≤ agora
- `expiresAt` é nulo **ou** > agora
- destinatário: `ALL` (ativos elegíveis ao consumo) **ou** `FILTERED` (AND dos targets)
- Cliente: vê comunicados `ALL` ou cujo target casa com seu CNPJ / grupo econômico / `clientOrgId`
- Candidato: não consome feed de comunicados (home institucional + Selecty)

Histórico: PUBLICADO ou EXPIRADO elegíveis ao perfil (não mostra rascunho, agendado, cancelado).

### R4 — Prioridade (visual e notificação)

- `normal` — padrão, sem ênfase extra
- `importante` — indicador discreto no card e no sino
- `urgente` — diferenciado no DS (cor de perigo/atenção já existente), nunca “alarme genérico”

Web Push e in-app usam a mesma prioridade para ordenação, não para copiar o texto da notificação (texto padrão único no MVP; ver R8).

### R5 — Popup automático de não visualizado (validação Product)

A regra sugerida (urgente → importante → normal → mais recente) **é aceita**, com limites de UX:

1. Elegível + o colaborador **não** tem registro de visualização.
2. Ordenação: prioridade (urgente, importante, normal) e, empate, `publishedAt` desc.
3. **Um** popup por entrada na home (por visita de página home). Não empilhar dez modais.
4. Demais não lidos aparecem na home, no sino e no filtro “não visualizados”.
5. Ações do popup:
   - **Abrir / Entendi** → persiste visualização → não dispara de novo para aquele comunicado.
   - **Ver depois** → **não** grava visualização; não reabre o **mesmo** popup nesta carga da home; na **próxima** visita à home, pode aparecer de novo se continuar não visualizado.
6. Fonte da verdade: tabela de visualização. Qualquer “já vi neste page load” é só UX de sessão, não substitui o banco.

### R6 — Visualização

- Primeira abertura confirmada (detalhe ou Entendi no popup) grava `userId`, `communicationId`, `firstViewedAt`.
- MVP: binário visualizou / não visualizou.
- Modelo pode guardar `lastViewedAt` e `viewCount` para o futuro, sem UI obrigatória.
- Comunicador ver métricas derivadas (contagem), não um número digitado à mão.

**Elegíveis para métrica:** usuários com papel de colaborador provisionados no app (projeção Entra). Comunicadores entram na base de elegíveis (são colaboradores). Não há lista HR externa no MVP.

### R7 — Público / segmentação

- `audienceType`: `ALL` | `FILTERED`.
- Targets: `CONTRACT_STATUS`, `CONTRACT_TYPE`, `ECONOMIC_GROUP`, `CNPJ`, `HEALTH_PLAN`, `REIMBURSEMENT_CARD`, `USER_ID` (AND quando vários).
- Preview de contagem de destinatários antes de publicar.
- Atributos de RH no usuário local (sem sync ERP neste ciclo).

### R8 — Notificações

Na **publicação efetiva** (agora ou agendada):

1. Evento de domínio “comunicado publicado”.
2. Canal in-app: item no centro de notificações dos colaboradores.
3. Canal Web Push: envio para subscriptions ativas.
4. Canais e-mail / Teams: **não** no MVP; o evento não pode ficar preso ao Push.

Texto padrão do push (MVP):

- Título: `Nova comunicação interna`
- Corpo: `Confira o novo comunicado publicado.`
- Clique: abre o app (PWA se instalado) na rota do comunicado; autentica se a sessão expirou.

Urgente não muda o texto no MVP; muda ordenação e ênfase visual in-app.

Permissão de push:

- Não pedir no primeiro pixel.
- Após primeiro acesso autenticado, convite contextual uma vez (“Quer receber avisos importantes…?”).
- Agora não / bloqueio do browser: não insistir em loop; configurações permitem tentar de novo se o browser ainda não bloqueou de forma permanente.
- Múltiplos dispositivos: uma subscription por endpoint; várias por usuário.

### R9 — Conteúdo e mídia

- HTML/rich text sanitizado na persistência e na renderização.
- Capa obrigatória? **Não** (opcional).
- Arquivos não vão para o SQL; storage local de dev com troca futura para Azure Blob.

### R10 — Busca e filtros

- Colaborador: texto em título, resumo e conteúdo; categoria; período; somente não visualizados.
- Comunicador (admin): status, categoria, prioridade, período, autor.

### R11 — Auditoria

Registrar: criado, editado, publicado, agendamento cancelado (volta a rascunho), cancelado, visualizado. Sem PII extra (não gravar conteúdo completo no log se o próprio comunicado já existe).

## Critérios de aceite

Os itens abaixo são os de produto; detalhes técnicos (lint, build, security review) estão no Definition of Done da fábrica.

- [ ] Usuário autentica só com Entra ID (sem senha da aplicação)
- [ ] Colaborador acessa a Home autenticado
- [ ] Sem papel de comunicador, não acessa funções de `/admin` (UI e servidor)
- [ ] Comunicador acessa `/admin`
- [ ] Comunicador cria comunicado e salva rascunho
- [ ] Comunicador publica comunicado
- [ ] Comunicador agenda publicação futura
- [ ] Comunicador cancela agendamento e o item deixa de estar AGENDADO
- [ ] Colaborador vê apenas comunicados elegíveis (R3)
- [ ] Abrir/confirmar comunicado grava visualização no banco
- [ ] Popup aparece para não visualizado elegível, na ordem R5
- [ ] Após visualização, o mesmo comunicado não é mais “não visualizado”
- [ ] Histórico, busca e filtros do colaborador funcionam conforme R10
- [ ] Dashboard e métricas por comunicado batem com contagens do banco
- [ ] PWA: manifest e service worker servidos; instalação quando o browser oferece
- [ ] Usuário pode ativar notificações; subscription persistida por dispositivo
- [ ] Publicação dispara in-app; Web Push é enviado quando há subscription válida
- [ ] Clique no push (ambiente compatível) abre o comunicado correspondente
- [ ] Ambiente sem suporte a push mostra orientação honesta (incl. limitações iOS)
- [ ] Conteúdo rico não executa script (sanitização)
- [ ] Seed local fictício cobre os dois papéis e vários status/leituras

## Escopo do MVP (evolução)

Monolito Next.js, schema próprio, quatro perfis, audiência ALL/FILTERED, bloco institucional (site/redes/YouTube), superfícies Cliente/Colaborador/Candidato (CS, FAQ, links, NPS/CSAT, Selecty), leitura rastreada, PWA, Web Push, admin METARH.

## Fora de escopo

- App nativo (React Native, Flutter, stores)
- Sync automático com ERP/folha
- Motor NPS/CSAT nativo (apenas links)
- Scraping / API Selecty de vagas (apenas deep link / embed)
- WhatsApp Business API (apenas `wa.me`)
- E-mail marketing, Teams, SMS
- Despublicar comunicado já publicado; edição “silenciosa” sem auditoria
- BI avançado, multi-tenant, worker distribuído
- Comentários, reações, confirmação jurídica
- Tradução / i18n além de português

## Decisões de produto (explícitas)

1. **Popup:** um por visita à home, não fila modal.
2. **Cancelar agenda:** volta a rascunho.
3. **Newsletter:** categoria, não produto de e-mail.
4. **Comunicador ⊆ colaborador.**
5. **Métricas:** derivadas do banco (usuários provisionados × leituras).
6. **Push:** texto único no MVP; prioridade não altera o copy.

## Factory Improvement Opportunity (observado na etapa Product)

| | |
| --- | --- |
| **Problema** | O template gera o app com papéis `ADMIN` / `USER` e dashboard genérico **antes** do Product definir o domínio. |
| **Impacto** | Risco de o MVP herdar vocabulário errado (admin vs comunicador) ou de Product ser preenchido “em cima” do template. |
| **Causa** | `scripts/create-app.mjs` + template `next-monolith` bootstrapam código mínimo na mesma hora em que o pipeline pede Product primeiro. |
| **Sugestão** | Manter o bootstrap (necessário para pasta do app), mas tratar `ADMIN`/`USER` como papéis técnicos de *scaffold* a serem substituídos pelo Product; o Product deste app define `COLABORADOR` / `COMUNICADOR`. Não alterar a Factory neste ciclo. |
| **Arquivo** | `templates/next-monolith`, `scripts/create-app.mjs`, `.cursor/skills/orchestrator/SKILL.md` |
