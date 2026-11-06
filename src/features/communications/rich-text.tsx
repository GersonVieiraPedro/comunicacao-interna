import { sanitizeCommunicationHtml } from "@/lib/sanitize-html";

export function RichText({ html }: { html: string }) {
  const clean = sanitizeCommunicationHtml(html);
  return (
    <div
      className="prose-comms max-w-none space-y-3 text-base leading-relaxed text-fg [&_a]:text-accent [&_a]:underline [&_img]:max-w-full [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
