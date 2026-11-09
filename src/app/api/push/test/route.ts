import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCommunicator } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { sendBroadcastTestPush } from "@/services/push-service";

/** Somente comunicador/admin — envia "Notificação Teste" para todos os dispositivos. */
export async function POST() {
  try {
    const session = await auth();
    requireCommunicator(session?.user);
    const result = await sendBroadcastTestPush();
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
