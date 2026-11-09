import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/lib/authz";
import { markNotificationOpenedByCommunication } from "@/repositories/notification-repository";
import { recordView } from "@/services/communication-service";

const bodySchema = z.object({
  communicationId: z.string().uuid(),
});

/** Clique em push/notificação: marca abertura e visualização (sem confirmar ciência). */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = requireUser(session?.user);
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.parse(json);
    await markNotificationOpenedByCommunication(user.id, parsed.communicationId);
    await recordView(session?.user, parsed.communicationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
