import { describe, expect, it } from "vitest";
import { composeDocument, parseDocument } from "@/features/communications/document-html";

describe("document-html", () => {
  it("compõe cabeçalho, corpo e rodapé", () => {
    const html = composeDocument({
      headerHtml: "<p>Meta RH</p>",
      bodyHtml: "<p>Conteúdo</p>",
      footerHtml: "<p>Dúvidas no canal</p>",
    });
    expect(html).toContain('class="cci-header"');
    expect(html).toContain('class="cci-body"');
    expect(html).toContain('class="cci-footer"');
  });

  it("reestrutura documento composto", () => {
    const html = composeDocument({
      headerHtml: "<p>Topo</p>",
      bodyHtml: "<p>Meio</p>",
      footerHtml: "<p>Base</p>",
    });
    const parsed = parseDocument(html);
    expect(parsed.headerHtml).toContain("Topo");
    expect(parsed.bodyHtml).toContain("Meio");
    expect(parsed.footerHtml).toContain("Base");
  });

  it("trata HTML legado como corpo", () => {
    const parsed = parseDocument("<p>Legado</p>");
    expect(parsed.headerHtml).toBe("");
    expect(parsed.bodyHtml).toContain("Legado");
    expect(parsed.footerHtml).toBe("");
  });
});
