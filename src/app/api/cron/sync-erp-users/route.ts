import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  runErpUserMergeProcedure,
  bootstrapErpTempPasswords,
} from "@/services/erp-user-sync-service";

/** Vercel Pro: até 60s; Hobby corta antes. Bootstrap em lote pequeno. */
export const maxDuration = 60;
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado", code: "UNAUTHORIZED" }, { status: 401 });
}

function authorize(request: Request) {
  const env = getEnv();
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (!env.CRON_SECRET) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sanitizeDetail(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/Password=[^;]*/gi, "Password=[redacted]")
    .slice(0, 400);
}

function hintForStep(step: string, detail: string): string {
  const d = detail.toLowerCase();
  if (step === "merge") {
    if (d.includes("timeout") || d.includes("timed out")) {
      return "MERGE no SQL demorou demais. Rode EXEC usp_SyncUsersFromErp no SSMS; na WebActivity use passwordsOnly.";
    }
    if (d.includes("invalid object") || d.includes("alocados.employees")) {
      return "View alocados.employees ou procedure ausente/inacessível no banco ligado à DATABASE_URL.";
    }
    return "Falha no EXEC usp_SyncUsersFromErp. Confira procedure/view no SSMS e o log Vercel (msg erp_merge_procedure_failed).";
  }
  if (step === "bootstrap_passwords") {
    if (d.includes("timeout")) {
      return "bcrypt/lote estourou tempo. Use batchSize 50–100 ou npm run bootstrap:erp-passwords.";
    }
    return "Falha ao gravar passwordHash. Confira DATABASE_URL e pendentes no diagnostics SQL.";
  }
  if (step === "authorize" || step === "env") {
    return "CRON_SECRET ou env obrigatória ausente/errada na Vercel.";
  }
  return "Veja step+detail nesta resposta e o log JSON da função na Vercel.";
}

function cronError(step: string, error: unknown) {
  const detail = sanitizeDetail(error);
  const hint = hintForStep(step, detail);
  logger.error("cron_sync_erp_users_failed", { step, detail, hint });
  return NextResponse.json(
    {
      error: "Falha no sync ERP (cron).",
      code: "ERP_SYNC_FAILED",
      step,
      detail,
      hint,
    },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  let step = "env";
  try {
    step = "authorize";
    if (!authorize(request)) return unauthorized();

    let bootstrapPasswords = true;
    let passwordsOnly = false;
    let batchSize = 100;

    step = "parse_body";
    // ADF WebActivity às vezes manda body vazio, objeto ou JSON em string dupla.
    const rawText = await request.text();
    let body: {
      bootstrapPasswords?: boolean;
      passwordsOnly?: boolean;
      batchSize?: number;
      passwordBatch?: number;
    } = {};
    if (rawText.trim()) {
      try {
        const parsed: unknown = JSON.parse(rawText);
        if (typeof parsed === "string") {
          body = JSON.parse(parsed) as typeof body;
        } else if (parsed && typeof parsed === "object") {
          body = parsed as typeof body;
        }
      } catch {
        logger.warn("cron_sync_erp_users_body_unparsed", {
          bodyLength: rawText.length,
          bodyPreview: rawText.slice(0, 80),
        });
      }
    }
    if (body.bootstrapPasswords === false) bootstrapPasswords = false;
    if (body.passwordsOnly === true) passwordsOnly = true;
    const rawBatch = body.batchSize ?? body.passwordBatch;
    if (typeof rawBatch === "number" && Number.isFinite(rawBatch)) {
      batchSize = Math.min(500, Math.max(1, Math.floor(rawBatch)));
    }

    logger.info("cron_sync_erp_users_start", {
      passwordsOnly,
      bootstrapPasswords,
      batchSize,
      bodyLength: rawText.length,
    });

    if (passwordsOnly) {
      step = "bootstrap_passwords";
      const passwords = await bootstrapErpTempPasswords(batchSize);
      const payload = {
        passwordsOnly: true as const,
        passwords,
        batchSize,
        done: passwords.updated < batchSize,
      };
      logger.info("cron_sync_erp_users_ok", payload);
      return NextResponse.json(payload);
    }

    step = "merge";
    await runErpUserMergeProcedure();

    let passwords = { updated: 0, scanned: 0 };
    if (bootstrapPasswords) {
      step = "bootstrap_passwords";
      passwords = await bootstrapErpTempPasswords(batchSize);
    }

    const payload = {
      merge: true as const,
      passwords,
      batchSize,
      done: !bootstrapPasswords || passwords.updated < batchSize,
    };
    logger.info("cron_sync_erp_users_ok", payload);
    return NextResponse.json(payload);
  } catch (error) {
    return cronError(step, error);
  }
}
