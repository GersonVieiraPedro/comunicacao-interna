import { describe, expect, it } from "vitest";
import { mediaSrc } from "@/lib/media-url";

describe("mediaSrc", () => {
  it("resolve path local", () => {
    expect(mediaSrc("covers/a.png")).toBe("/api/media/covers/a.png");
  });

  it("mantém data URL e https", () => {
    expect(mediaSrc("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(mediaSrc("https://blob.example/x.png")).toBe("https://blob.example/x.png");
  });

  it("nulo vazio", () => {
    expect(mediaSrc(null)).toBeNull();
    expect(mediaSrc("")).toBeNull();
  });
});
