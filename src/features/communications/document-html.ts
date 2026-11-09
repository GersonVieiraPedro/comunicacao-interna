export type DocumentParts = {
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
};

function isMeaningful(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 || /<img\b/i.test(html);
}

export function composeDocument(parts: DocumentParts): string {
  const chunks: string[] = [];
  if (isMeaningful(parts.headerHtml)) {
    chunks.push(`<header class="cci-header">${parts.headerHtml}</header>`);
  }
  chunks.push(`<div class="cci-body">${parts.bodyHtml?.trim() ? parts.bodyHtml : "<p></p>"}</div>`);
  if (isMeaningful(parts.footerHtml)) {
    chunks.push(`<footer class="cci-footer">${parts.footerHtml}</footer>`);
  }
  return chunks.join("\n");
}

export function parseDocument(html: string): DocumentParts {
  const source = html?.trim() ?? "";
  if (!source) {
    return { headerHtml: "", bodyHtml: "<p></p>", footerHtml: "" };
  }

  const headerMatch = source.match(/<header[^>]*class=["']?cci-header["']?[^>]*>([\s\S]*?)<\/header>/i);
  const footerMatch = source.match(/<footer[^>]*class=["']?cci-footer["']?[^>]*>([\s\S]*?)<\/footer>/i);
  const bodyMatch = source.match(/<div[^>]*class=["']?cci-body["']?[^>]*>([\s\S]*?)<\/div>/i);

  if (headerMatch || footerMatch || bodyMatch) {
    return {
      headerHtml: headerMatch?.[1]?.trim() ?? "",
      bodyHtml: bodyMatch?.[1]?.trim() || "<p></p>",
      footerHtml: footerMatch?.[1]?.trim() ?? "",
    };
  }

  return { headerHtml: "", bodyHtml: source, footerHtml: "" };
}
