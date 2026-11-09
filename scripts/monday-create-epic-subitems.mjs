/**
 * Recria as epics como subitens do pulse Monday.
 *
 * - Título: "E1 Identidade, papéis e sessão" (sem status e sem traço longo)
 * - Status na coluna Status
 * - Owner = usuário do token
 * - Descrição via update no subitem
 *
 * Uso:
 *   $env:MONDAY_API_TOKEN = "seu_token"
 *   node scripts/monday-create-epic-subitems.mjs
 */

const API_URL = process.env.MONDAY_API_URL || "https://api.monday.com/v2";
const TOKEN = process.env.MONDAY_API_TOKEN;
const PARENT_ITEM_ID = process.env.MONDAY_PARENT_ITEM_ID || "13358122839";
const REPLACE_EXISTING = process.env.MONDAY_REPLACE !== "0";

const EPICS = [
  {
    name: "E1 Identidade, papéis e sessão",
    status: "Feito",
    description:
      "Login interno com e-mail e senha (JWT), papéis de colaborador e comunicador com autorização no servidor, e seed operacional de usuários. O piloto usa auth interno; Entra ID fica para depois.",
  },
  {
    name: "E2 Modelo de comunicado e persistência",
    status: "Feito",
    description:
      "Schema Prisma no banco comunicacao, migrations versionadas, categorias iniciais e CRUD de rascunho com validação.",
  },
  {
    name: "E3 Publicar, agendar e expirar",
    status: "Feito",
    description:
      "Publicação imediata, agendamento com timezone correto, cancelamento de agenda voltando a rascunho, expiração automática e publicação oportunística dos itens vencidos (mitiga o cron diário do Hobby).",
  },
  {
    name: "E4 Home do colaborador, detalhe e leitura",
    status: "Feito",
    description:
      "Feed autenticado com destaque e últimos comunicados, tela de detalhe com conteúdo sanitizado e registro de visualização no servidor.",
  },
  {
    name: "E5 Popup de não visualizado",
    status: "Feito",
    description:
      "Um popup por visita à home, ordenado por urgência e data, com ações Entendi e Ver depois conforme a regra de produto.",
  },
  {
    name: "E6 Histórico, busca e filtros",
    status: "Feito",
    description:
      "Histórico do colaborador para publicados e expirados, com filtros e busca SQL nos campos definidos no product.",
  },
  {
    name: "E7 Admin lista, editor, dashboard e agenda",
    status: "Feito",
    description:
      "Lista administrativa com filtros, dashboard de totais e menor taxa de leitura, editor rico com cabeçalho, corpo e rodapé, agenda de publicações e métricas por comunicado.",
  },
  {
    name: "E8 Notificações in-app",
    status: "Feito",
    description:
      "Fan-out no momento da publicação para o centro de alertas, com marcação de lida e abertura do comunicado.",
  },
  {
    name: "E9 PWA",
    status: "Feito",
    description:
      "Manifest, service worker e modo standalone, com navegação mobile e shell desktop. Ícones PNG de produção ficam em E14.",
  },
  {
    name: "E10 Web Push",
    status: "Feito",
    description:
      "VAPID e subscription por dispositivo, prompt não agressivo, push na publicação e no agendamento efetivado, além do teste admin de broadcast.",
  },
  {
    name: "E11 Capa e mídia",
    status: "Feito",
    description:
      "Upload de capa e imagens inline (JPEG, PNG, WebP até 2 MB) servidas por API autenticada. Persistência durável em Blob fica em E14.",
  },
  {
    name: "E12 Qualidade de fábrica (fechamento)",
    status: "Em andamento",
    description:
      "Suíte unitária e CI já verdes. Ainda faltam E2E autenticados (publicar, popup, leitura, agenda) e alinhar product/security ao auth interno do piloto.",
  },
  {
    name: "E13 Endurecimento do piloto",
    status: "Em andamento",
    description:
      "Polimento de som/push, gestão simples de usuários no admin, checklist operacional de seed/reset e revisão humana de uso real com comunicador e colaboradores.",
  },
  {
    name: "E14 Infra de mídia e PWA de produção",
    status: "Não iniciado",
    description:
      "Storage persistente (Azure Blob ou equivalente), ícones PWA PNG 180/192/512 e política mínima de retenção de uploads.",
  },
  {
    name: "E15 Agendamento confiável em tempo quase real",
    status: "Não iniciado",
    description:
      "Cron a cada minuto ou worker externo para publicar na janela acordada, com observabilidade do job e publicação oportunística como rede de segurança.",
  },
  {
    name: "E16 Segurança e go-live (HITL)",
    status: "Não iniciado",
    description:
      "Security review atualizado, checklist de produção preenchido, aprovação humana explícita de go-live e plano de backup/restore do schema comunicacao.",
  },
  {
    name: "E17 Aceite formal do MVP",
    status: "Não iniciado",
    description:
      "Roteiro de aceite product executado, débitos explícitos no backlog e runbook operacional para quem publica, agenda e reseta senha.",
  },
  {
    name: "E18+ Pós-MVP (Entra, segmentação e canais)",
    status: "Não iniciado",
    description:
      "Fora do fechamento atual: Entra SSO como padrão, segmentação de audiência, despublicar, e-mail/Teams, templates avançados de push, BI e multi-tenant.",
  },
];

async function monday(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: TOKEN,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(JSON.stringify(payload.errors ?? payload, null, 2));
  }
  return payload.data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMe() {
  const data = await monday(`query { me { id name email } }`);
  return data.me;
}

async function getParentSubitems() {
  const data = await monday(
    `query ($ids: [ID!]!) {
      items(ids: $ids) {
        id
        name
        subitems { id name }
      }
    }`,
    { ids: [PARENT_ITEM_ID] },
  );
  const item = data.items?.[0];
  if (!item) throw new Error(`Pulse ${PARENT_ITEM_ID} não encontrado.`);
  return item;
}

async function deleteItem(itemId) {
  await monday(
    `mutation ($id: ID!) {
      delete_item(item_id: $id) { id }
    }`,
    { id: itemId },
  );
}

async function createSubitem({ name, statusLabel, personId }) {
  const columnValues = JSON.stringify({
    status: { label: statusLabel },
    person: {
      personsAndTeams: [{ id: Number(personId), kind: "person" }],
    },
  });

  const data = await monday(
    `mutation ($parentId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_subitem(
        parent_item_id: $parentId
        item_name: $itemName
        column_values: $columnValues
        create_labels_if_missing: true
      ) {
        id
        name
      }
    }`,
    {
      parentId: PARENT_ITEM_ID,
      itemName: name,
      columnValues,
    },
  );
  return data.create_subitem;
}

async function createDescription(itemId, body) {
  await monday(
    `mutation ($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) { id }
    }`,
    { itemId, body },
  );
}

async function main() {
  if (!TOKEN) {
    console.error("Defina MONDAY_API_TOKEN.");
    process.exit(1);
  }

  const me = await getMe();
  console.log(`Usuário: ${me.name} (${me.id})`);

  const parent = await getParentSubitems();
  console.log(`Atividade: ${parent.name}`);
  console.log(`Subitens atuais: ${parent.subitems?.length ?? 0}`);

  if (REPLACE_EXISTING && parent.subitems?.length) {
    for (const sub of parent.subitems) {
      await deleteItem(sub.id);
      console.log(`apagou ${sub.id}  ${sub.name}`);
      await sleep(250);
    }
  }

  let created = 0;
  for (const epic of EPICS) {
    const sub = await createSubitem({
      name: epic.name,
      statusLabel: epic.status,
      personId: me.id,
    });
    await sleep(250);
    await createDescription(sub.id, epic.description);
    console.log(`ok ${sub.id}  ${sub.name}  [${epic.status}]`);
    created += 1;
    await sleep(300);
  }

  console.log(`\nRecriados: ${created}`);
  console.log(`https://metarh-central.monday.com/boards/18170557498/pulses/${PARENT_ITEM_ID}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
