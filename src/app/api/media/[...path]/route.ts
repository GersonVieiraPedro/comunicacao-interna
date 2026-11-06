import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireUser } from "@/lib/authz";
import { coverAbsolutePath } from "@/services/file-storage";
import { jsonError } from "@/lib/http";
import { NotFoundError } from "@/lib/errors";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const session = await auth();
    requireUser(session?.user);
    const { path: parts } = await context.params;
    const relative = parts.join("/");
    const absolute = coverAbsolutePath(relative);
    try {
      const file = await readFile(absolute);
      return new NextResponse(file, {
        headers: { "Content-Type": "application/octet-stream", "Cache-Control": "private, max-age=3600" },
      });
    } catch {
      throw new NotFoundError("Arquivo não encontrado.");
    }
  } catch (error) {
    return jsonError(error);
  }
}
