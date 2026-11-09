import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCommunicator } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { ValidationError } from "@/lib/errors";
import { IMAGE_LIMITS, formatBytes } from "@/lib/image-limits";
import { saveCoverFile, saveInlineImage } from "@/services/file-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    requireCommunicator(session?.user);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Arquivo de imagem obrigatório.");
    }
    const kind = form.get("kind") === "cover" ? "cover" : "inline";
    const stored = kind === "cover" ? await saveCoverFile(file) : await saveInlineImage(file);
    return NextResponse.json({
      path: stored.path,
      url: stored.url,
      storage: stored.storage,
      contentType: stored.contentType,
      originalBytes: stored.originalBytes,
      optimizedBytes: stored.optimizedBytes,
      originalSizeLabel: formatBytes(stored.originalBytes),
      optimizedSizeLabel: formatBytes(stored.optimizedBytes),
      limits: {
        maxUploadLabel: IMAGE_LIMITS.maxUploadLabel,
        allowedLabel: IMAGE_LIMITS.allowedLabel,
        coverMaxEdge: IMAGE_LIMITS.coverMaxEdge,
        inlineMaxEdge: IMAGE_LIMITS.inlineMaxEdge,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
