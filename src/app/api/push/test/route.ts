import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireUser } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { sendTestPushToUser } from "@/services/push-service";

export async function POST() {
  try {
    const session = await auth();
    const user = requireUser(session?.user);
    const result = await sendTestPushToUser(user.id);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
