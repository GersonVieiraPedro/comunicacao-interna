import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";
import { processScheduledJobs } from "@/services/communication-service";
import { jsonError } from "@/lib/http";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    const env = getEnv();
    const header = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${env.CRON_SECRET}`;
    if (!env.CRON_SECRET) return unauthorized();
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return unauthorized();
    const result = await processScheduledJobs();
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
