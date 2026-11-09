import { describe, expect, it } from "vitest";
import { IMAGE_LIMITS, formatBytes } from "@/lib/image-limits";

describe("image-limits", () => {
  it("define upload de 10 MB", () => {
    expect(IMAGE_LIMITS.maxUploadBytes).toBe(10 * 1024 * 1024);
    expect(IMAGE_LIMITS.maxUploadLabel).toBe("10 MB");
  });

  it("formata bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.00 MB");
  });
});
