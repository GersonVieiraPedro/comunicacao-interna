import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCommunicator } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { ValidationError } from "@/lib/errors";
import { saveCoverFile, saveInlineImage } from "@/services/file-storage";

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
    const relative = kind === "cover" ? await saveCoverFile(file) : await saveInlineImage(file);
    return NextResponse.json({
      path: relative,
      url: `/api/media/${relative}`,
    });
  } catch (error) {
    return jsonError(error);
  }
}
