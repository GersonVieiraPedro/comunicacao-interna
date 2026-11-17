import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { syncErpUsers, bootstrapErpTempPasswords } from "@/services/erp-user-sync-service";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    if (!authorize(request)) return unauthorized();
    let bootstrapPasswords = true;
    let passwordsOnly = false;
    try {
      const body = (await request.json()) as {
        bootstrapPasswords?: boolean;
        passwordsOnly?: boolean;
      };
      if (body.bootstrapPasswords === false) bootstrapPasswords = false;
      if (body.passwordsOnly === true) passwordsOnly = true;
    } catch {
      // body opcional
    }

    if (passwordsOnly) {
      const passwords = await bootstrapErpTempPasswords(2000);
      return NextResponse.json({ passwordsOnly: true, passwords });
    }

    const result = await syncErpUsers({ bootstrapPasswords });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
