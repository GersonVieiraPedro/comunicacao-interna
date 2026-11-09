import { sanitizeCommunicationHtml } from "@/lib/sanitize-html";

export function RichText({ html }: { html: string }) {
  const clean = sanitizeCommunicationHtml(html);
  return (
    <div
      className="sf-prose max-w-none [&_a]:font-medium [&_blockquote]:border-l-4 [&_blockquote]:border-spark [&_blockquote]:bg-accent-subtle/50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-1 [&_ol]:list-decimal [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
