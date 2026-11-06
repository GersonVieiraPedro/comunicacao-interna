import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/lib/authz";
import { upsertPushSubscription, deactivateByEndpoint } from "@/repositories/push-repository";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = requireUser(session?.user);
    const body = schema.parse(await request.json());
    await upsertPushSubscription({
      userId: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    requireUser(session?.user);
    const body = schema.pick({ endpoint: true }).parse(await request.json());
    await deactivateByEndpoint(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
