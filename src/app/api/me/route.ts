import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/lib/authz";

export async function GET() {
  try {
    const session = await auth();
    const user = requireUser(session?.user);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    });
  } catch (error) {
    return jsonError(error);
  }
}
