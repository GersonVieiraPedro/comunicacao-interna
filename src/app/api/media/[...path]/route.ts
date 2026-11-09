import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireUser } from "@/lib/authz";
import { azureReadUrl, coverAbsolutePath } from "@/services/file-storage";
import { jsonError } from "@/lib/http";
import { NotFoundError } from "@/lib/errors";

function contentTypeFor(relative: string) {
  if (relative.endsWith(".png")) return "image/png";
  if (relative.endsWith(".webp")) return "image/webp";
  if (relative.endsWith(".jpg") || relative.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function readFromAzure(relative: string) {
  const signed = azureReadUrl(relative);
  if (!signed) return null;
  const response = await fetch(signed, { method: "GET" });
  if (!response.ok) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentTypeFor(relative),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const session = await auth();
    requireUser(session?.user);
    const { path: parts } = await context.params;
    const relative = parts.join("/").replace(/^azure:/, "");

    // 1) Disco local (dev)
    try {
      const absolute = coverAbsolutePath(relative);
      const file = await readFile(absolute);
      return new NextResponse(file, {
        headers: {
          "Content-Type": contentTypeFor(relative),
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      // segue para Azure
    }

    // 2) Azure Blob via SAS do servidor (não expõe o token ao browser)
    const fromAzure = await readFromAzure(relative);
    if (fromAzure) return fromAzure;

    throw new NotFoundError("Arquivo não encontrado.");
  } catch (error) {
    return jsonError(error);
  }
}
