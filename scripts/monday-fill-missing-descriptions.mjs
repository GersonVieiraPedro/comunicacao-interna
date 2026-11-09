/**
 * Preenche a descrição nativa do item (não o feed de updates)
 * via set_item_description_content para E11+.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const API_URL = process.env.MONDAY_API_URL || "https://api.monday.com/v2";
const PARENT_ITEM_ID = process.env.MONDAY_PARENT_ITEM_ID || "13358122839";

function loadToken() {
  if (process.env.MONDAY_API_TOKEN) return process.env.MONDAY_API_TOKEN;
  const envPath = resolve(process.cwd(), ".env");
  const raw = readFileSync(envPath, "utf8");
  const line = raw.split(/\r?\n/).find((l) => /^\s*MONDAY_API_TOKEN\s*=/.test(l));
  if (!line) throw new Error("MONDAY_API_TOKEN não encontrado");
  return line
    .replace(/^\s*MONDAY_API_TOKEN\s*=\s*/, "")
    .replace(/^["']/, "")
    .replace(/["']$/, "")
    .trim();
}

const TOKEN = loadToken();

const DESCRIPTIONS = {
  "E11 Capa e mídia":
    "Upload de capa e imagens inline (JPEG, PNG, WebP até 2 MB) servidas por API autenticada. Persistência durável em Blob fica em E14.",
  "E12 Qualidade de fábrica (fechamento)":
    "Suíte unitária e CI já verdes. Ainda faltam E2E autenticados (publicar, popup, leitura, agenda) e alinhar product/security ao auth interno do piloto.",
  "E13 Endurecimento do piloto":
    "Polimento de som/push, gestão simples de usuários no admin, checklist operacional de seed/reset e revisão humana de uso real com comunicador e colaboradores.",
  "E14 Infra de mídia e PWA de produção":
    "Storage persistente (Azure Blob ou equivalente), ícones PWA PNG 180/192/512 e política mínima de retenção de uploads.",
  "E15 Agendamento confiável em tempo quase real":
    "Cron a cada minuto ou worker externo para publicar na janela acordada, com observabilidade do job e publicação oportunística como rede de segurança.",
  "E16 Segurança e go-live (HITL)":
    "Security review atualizado, checklist de produção preenchido, aprovação humana explícita de go-live e plano de backup/restore do schema comunicacao.",
  "E17 Aceite formal do MVP":
    "Roteiro de aceite product executado, débitos explícitos no backlog e runbook operacional para quem publica, agenda e reseta senha.",
  "E18+ Pós-MVP (Entra, segmentação e canais)":
    "Fora do fechamento atual: Entra SSO como padrão, segmentação de audiência, despublicar, e-mail/Teams, templates avançados de push, BI e multi-tenant.",
};

async function monday(query, variables = {}, apiVersion = "2026-04") {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: TOKEN,
      "API-Version": apiVersion,
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
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const data = await monday(
    `query ($ids: [ID!]!) {
      items(ids: $ids) {
        subitems { id name }
      }
    }`,
    { ids: [PARENT_ITEM_ID] },
    "2024-10",
  );

  const subitems = data.items?.[0]?.subitems ?? [];
  const targets = subitems.filter((s) => Object.prototype.hasOwnProperty.call(DESCRIPTIONS, s.name));
  console.log(`Alvos: ${targets.length}`);

  for (const item of targets) {
    const markdown = DESCRIPTIONS[item.name];
    try {
      const result = await monday(
        `mutation ($itemId: ID!, $markdown: String!) {
          set_item_description_content(item_id: $itemId, markdown: $markdown) {
            success
            error
            block_ids
          }
        }`,
        { itemId: item.id, markdown },
        "2026-04",
      );
      const payload = result.set_item_description_content;
      if (!payload?.success) {
        throw new Error(payload?.error || "set_item_description_content falhou");
      }
      console.log(`ok descrição nativa  ${item.name}`);
    } catch (error) {
      // fallback: update em HTML
      await monday(
        `mutation ($itemId: ID!, $body: String!) {
          create_update(item_id: $itemId, body: $body) { id }
        }`,
        {
          itemId: item.id,
          body: `<p>${markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
        },
        "2024-10",
      );
      console.log(`ok update fallback  ${item.name}  (${error.message.slice(0, 80)})`);
    }
    await sleep(350);
  }

  console.log("Concluído.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
