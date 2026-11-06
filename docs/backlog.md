# Backlog — Central de Comunicação Interna

Fatias verticais. Status: `pronto para architecture` após Product.

Premissa: app já copiado de `templates/next-monolith` em `apps/comunicacao-interna` (schema `comunicacao`).

| ID | Fatia | Valor | Aceite (resumo) | Dependências | Status |
| --- | --- | --- | --- | --- | --- |
| F1 | Identidade, papéis e sessão Entra | Só entra quem é da empresa; dois papéis de produto | Login Entra; colaborador não acessa admin; comunicador acessa | Template auth | Product ok |
| F2 | Modelo de comunicado + persistência | Existe o objeto de negócio | CRUD rascunho no banco, status string, categorias seed | F1, schema | Product ok |
| F3 | Publicar / agendar / expirar | Comunicado chega na hora certa | Publicar agora; agendar; cancelar agenda → rascunho; expirado some da home ativa | F2 | Product ok |
| F4 | Home colaborador + detalhe + leitura | Consumo e evidência de leitura | Home, detalhe, `CommunicationRead`, não lido some | F3 | Product ok |
| F5 | Popup de não visualizado | Não perder o importante | Um popup/home, ordem urgente→importante→normal→recente | F4 | Product ok |
| F6 | Histórico, busca, filtros | Achar o passado | Filtros e busca SQL nos campos definidos | F4 | Product ok |
| F7 | Admin lista + editor + dashboard | Comunicador opera sozinho | Lista, editor rico sanitizado, métricas derivadas | F3, F4 | Product ok |
| F8 | In-app notifications | Sino com novos/urgentes | Criar no publicar; marcar lida; abrir comunicado | F3 | Product ok |
| F9 | PWA | Celular “como app” | Manifest, SW, standalone, nav mobile | F4 | Product ok |
| F10 | Web Push | Aviso com app fechado | Prompt não agressivo, subscription por device, envio no publicar, deep link; iOS documentado | F8, F9 | Product ok |
| F11 | Capa / storage | Imagem sem SQL | Upload local; interface substituível | F2 | Product ok |
| F12 | Qualidade de fábrica | Dá para validar a Factory | Testes das regras, E2E públicos, security, deploy doc, env.example | F1–F11 | Em QA |

Fora do backlog do MVP: e-mail, segmentação, app nativo, BI, despublicar.
