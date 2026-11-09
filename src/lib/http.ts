import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { toPublicError } from "@/lib/errors";

export function jsonError(error: unknown) {
  const publicError = toPublicError(error);
  logger.error("request_failed", {
    code: publicError.code,
    status: publicError.status,
    message: error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240),
  });
  return NextResponse.json(
    { error: publicError.message, code: publicError.code },
    { status: publicError.status },
  );
}
