import sharp from "sharp";
import { IMAGE_LIMITS } from "@/lib/image-limits";
import { logger } from "@/lib/logger";

export type OptimizedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  extension: "webp";
  width: number;
  height: number;
  originalBytes: number;
  optimizedBytes: number;
};

export async function optimizeImageBuffer(
  input: Buffer,
  kind: "cover" | "inline",
): Promise<OptimizedImage> {
  const maxEdge = kind === "cover" ? IMAGE_LIMITS.coverMaxEdge : IMAGE_LIMITS.inlineMaxEdge;
  const originalBytes = input.byteLength;

  try {
    const pipeline = sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: IMAGE_LIMITS.outputQuality,
        effort: 4,
      });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    logger.info("image_optimized", {
      kind,
      originalBytes,
      optimizedBytes: data.byteLength,
      width: info.width,
      height: info.height,
    });

    return {
      buffer: data,
      contentType: "image/webp",
      extension: "webp",
      width: info.width ?? 0,
      height: info.height ?? 0,
      originalBytes,
      optimizedBytes: data.byteLength,
    };
  } catch (error) {
    logger.error("image_optimize_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
