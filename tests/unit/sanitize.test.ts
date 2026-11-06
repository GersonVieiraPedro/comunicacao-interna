import { describe, expect, it } from "vitest";
import { sanitizeCommunicationHtml } from "@/lib/sanitize-html";

describe("sanitização", () => {
  it("remove script", () => {
    const clean = sanitizeCommunicationHtml('<p>ok</p><script>alert(1)</script>');
    expect(clean).toContain("ok");
    expect(clean).not.toContain("script");
  });
});
