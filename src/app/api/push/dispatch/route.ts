import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireCommunicator } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { sendWebPushForPublication } from "@/services/push-service";

const schema = z.object({
  communicationId: z.string().uuid(),
});

/**
 * Dispara Web Push de um comunicado já publicado.
 * Usado como caminho confiável (Route Handler) — mesmo runtime do teste admin.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    requireCommunicator(session?.user);
    const body = schema.parse(await request.json());
    const result = await sendWebPushForPublication(body.communicationId);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
