import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "img",
  "span",
  "div",
  "header",
  "footer",
  "hr",
];

export function sanitizeCommunicationHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "rel", "target"],
      img: ["src", "alt", "width", "height", "class"],
      span: ["class", "style"],
      p: ["class", "style"],
      div: ["class", "style"],
      header: ["class"],
      footer: ["class"],
      h1: ["class", "style"],
      h2: ["class", "style"],
      h3: ["class", "style"],
    },
    allowedStyles: {
      "*": {
        "font-size": [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
        "text-align": [/^(left|right|center|justify)$/],
        color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      a: ["http", "https", "mailto"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}
