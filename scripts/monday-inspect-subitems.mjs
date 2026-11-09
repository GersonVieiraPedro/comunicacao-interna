const API_URL = process.env.MONDAY_API_URL || "https://api.monday.com/v2";
const TOKEN = process.env.MONDAY_API_TOKEN;
const PARENT_ITEM_ID = process.env.MONDAY_PARENT_ITEM_ID || "13358122839";

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

const me = await monday(`query { me { id name email } }`);
const item = await monday(
  `query ($ids: [ID!]!) {
    items(ids: $ids) {
      id
      name
      subitems {
        id
        name
        board { id name }
        column_values { id type text value }
      }
    }
  }`,
  { ids: [PARENT_ITEM_ID] },
);

const parent = item.items?.[0];
const subBoardId = parent?.subitems?.[0]?.board?.id;
let columns = [];
if (subBoardId) {
  const board = await monday(
    `query ($ids: [ID!]!) {
      boards(ids: $ids) {
        id
        name
        columns { id title type settings_str }
      }
    }`,
    { ids: [subBoardId] },
  );
  columns = board.boards?.[0]?.columns ?? [];
}

console.log(JSON.stringify({ me: me.me, parentName: parent?.name, subBoardId, columns, sampleSubitem: parent?.subitems?.[0] ?? null, subitemCount: parent?.subitems?.length ?? 0 }, null, 2));
