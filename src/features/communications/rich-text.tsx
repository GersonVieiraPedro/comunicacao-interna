import { sanitizeCommunicationHtml } from "@/lib/sanitize-html";

export function RichText({ html }: { html: string }) {
  const clean = sanitizeCommunicationHtml(html);
  return (
    <div
      className="sf-prose max-w-none [&_.cci-header]:mb-5 [&_.cci-header]:rounded-xl [&_.cci-header]:border [&_.cci-header]:border-accent/15 [&_.cci-header]:bg-accent-subtle/50 [&_.cci-header]:px-4 [&_.cci-header]:py-3 [&_.cci-footer]:mt-6 [&_.cci-footer]:border-t [&_.cci-footer]:border-border [&_.cci-footer]:pt-4 [&_.cci-footer]:text-sm [&_.cci-footer]:text-fg-muted [&_a]:font-medium [&_blockquote]:border-l-4 [&_blockquote]:border-spark [&_blockquote]:bg-accent-subtle/50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl [&_li]:ml-1 [&_ol]:list-decimal [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
