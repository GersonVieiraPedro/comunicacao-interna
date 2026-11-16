import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireCommunicator } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { enqueuePublicationFanout, processDeliveryQueue } from "@/services/delivery-queue-service";

const schema = z.object({
  communicationId: z.string().uuid(),
});

/**
 * Garante job de fan-out na fila e processa um tick (não bloqueia publicação).
 * Preferir a fila automática; este endpoint serve retry manual / legado do editor.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    requireCommunicator(session?.user);
    const body = schema.parse(await request.json());
    await enqueuePublicationFanout(body.communicationId);
    const queue = await processDeliveryQueue({ maxJobs: 2, timeBudgetMs: 12_000 });
    return NextResponse.json({ ok: true, queued: true, ...queue });
  } catch (error) {
    return jsonError(error);
  }
}
