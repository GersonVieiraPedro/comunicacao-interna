# Product — Central de Comunicação Interna

**App:** `comunicacao-interna`  
**Hipótese do MVP:** colaboradores de ~400 pessoas encontram e não perdem comunicados institucionais se eles existirem em um único lugar autenticado, com leitura obrigatória dos não visualizados e aviso no celular quando o dispositivo permitir.  
**Status Product:** definido (aguardando validação humana do escopo).  
**Premissas:** usuários já possuem conta Microsoft corporativa (Entra ID); comunicadores são um conjunto pequeno e conhecido; nesta versão o público de cada comunicado é “todos os colaboradores autenticados”.

## Problema

Comunicados internos (avisos, notícias, newsletters, mensagens da diretoria, eventos, alertas) hoje se espalham por e-mail, conversas e materiais avulsos. Colaboradores perdem o que é urgente, não sabem o que já leram e não têm um histórico pesquisável. Comunicadores não conseguem saber quem visualizou o que foi publicado.

O problema **não** é “falta de um app nativo”. O problema é **falta de um canal único, autenticado, rastreável e acessível no celular**.

## Público

| Persona | Quem é | Necessidade principal |
| --- | --- | --- |
| **Colaborador** | Qualquer pessoa da empresa com conta Entra (~400) | Ver o que é novo, ler com conforto no celular, ser avisado do urgente, consultar histórico |
| **Comunicador** | Comunicação interna / RH / pessoas autorizadas | Publicar com qualidade, agendar, medir leitura básica, não depender de TI a cada envio |

O comunicador **também é colaborador**: consome a home e ainda acessa a área administrativa.

Papéis de produto (não são nomes de tabela):

- `COLABORADOR` — consumo
- `COMUNICADOR` — consumo + publicação e métricas

Não há persona “administrador de sistema” no MVP. Gestão de quem é comunicador é operacional (atribuir papel), não um módulo de IAM avançado.

## Objetivos

1. Centralizar publicação e consumo de comunicados institucionais.
2. Garantir que comunicado publicado e ainda não visualizado seja apresentado ao colaborador ao entrar.
3. Registrar visualização no servidor (fonte da verdade).
4. Permitir aviso no sistema operacional via Web Push quando o dispositivo/navegador e a permissão permitirem.
5. Validar a Software Factory com um produto que ~400 pessoas poderiam usar de fato.

**Métrica de sucesso do MVP (qualitativa + simples):** um comunicador publica; colaboradores autenticados veem, registram leitura e (em ambiente compatível) recebem push. Comunicador vê % de visualização.

## Funcionalidades (MVP)

### Autenticação e acesso

- Login somente via Microsoft Entra ID
- Sessão da fábrica (Auth.js)
- Colaborador: home, detalhe, histórico, busca, filtros, notificações in-app, preferência de push, instalação PWA
- Comunicador: tudo do colaborador + `/admin`

### Comunicado

- Criar, editar, rascunho, publicar, agendar, cancelar agendamento
- Categorias iniciais (evolutivas): Notícias, Comunicados, Eventos, Institucional, Pessoas, Tecnologia, RH, Newsletter, Outros
- Prioridade: normal, importante, urgente
- Capa (arquivo via storage abstrato; local no desenvolvimento)
- Conteúdo rico (título, subtítulo, parágrafos, listas, links, imagens, destaques)
- Status: RASCUNHO, AGENDADO, PUBLICADO, EXPIRADO, CANCELADO
- Público no MVP: todos os colaboradores (modelo preparado para segmentar depois)

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

- Todo usuário autenticado e provisionado é pelo menos colaborador.
- Comunicador = colaborador + área admin e mutações de comunicado.
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
- destinatário no MVP = todos os colaboradores autenticados

Histórico do colaborador: comunicados que **já foram publicados** e ainda são PUBLICADO ou EXPIRADO (não mostra rascunho, agendado, cancelado).

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

- MVP: `audience = ALL`.
- Proibido modelar de forma que “todos” seja um hardcode impossível de evoluir (departamento, unidade, etc.).
- Não implementar regras de segmento agora.

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

## Escopo do MVP

Um monolito Next.js, schema próprio, dois papéis, comunicados para todos, leitura rastreada, popup de não lido, PWA, Web Push, admin enxuto, busca SQL, agendamento simples, storage de imagens substituível, documentação e testes dos fluxos críticos.

## Fora de escopo

- App nativo (React Native, Flutter, stores)
- Senha local, SSO além de Entra ID
- E-mail marketing, envio de e-mail, Teams, SMS
- Segmentação por departamento/unidade/cargo/grupo
- Despublicar comunicado já publicado; edição “silenciosa” sem auditoria
- BI, analytics avançado, A/B, personalização por colaborador
- Elasticsearch / OpenSearch, Kafka, Redis, microsserviços, Kubernetes
- IAM self-service (convidar usuários, hierarquia de papéis)
- Multi-tenant, white-label, tema por cliente
- Worker distribuído / event sourcing / CQRS
- Comentários, reações, confirmação jurídica (ciente com senha)
- Tradução / i18n além de português
- Integração com intranet legado ou SharePoint

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
