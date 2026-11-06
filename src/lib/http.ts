import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { toPublicError } from "@/lib/errors";

export function jsonError(error: unknown) {
  const publicError = toPublicError(error);
  logger.error("request_failed", { code: publicError.code, status: publicError.status });
  return NextResponse.json(
    { error: publicError.message, code: publicError.code },
    { status: publicError.status },
  );
}
