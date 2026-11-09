import { sanitizeCommunicationHtml } from "@/lib/sanitize-html";

export function RichText({ html }: { html: string }) {
  const clean = sanitizeCommunicationHtml(html);
  return (
    <div
      className="sf-prose max-w-none [&_.cci-body]:px-5 [&_.cci-body]:py-5 md:[&_.cci-body]:px-7 md:[&_.cci-body]:py-7 [&_.cci-body_img]:my-3 [&_.cci-body_img]:rounded-xl [&_.cci-footer]:border-t [&_.cci-footer]:border-border [&_.cci-footer]:px-5 [&_.cci-footer]:py-4 [&_.cci-footer]:text-sm [&_.cci-footer]:text-fg-muted md:[&_.cci-footer]:px-7 [&_.cci-footer_img]:-mx-5 [&_.cci-footer_img]:my-0 [&_.cci-footer_img]:w-[calc(100%+2.5rem)] [&_.cci-footer_img]:max-w-none [&_.cci-footer_img]:rounded-none md:[&_.cci-footer_img]:-mx-7 md:[&_.cci-footer_img]:w-[calc(100%+3.5rem)] [&_.cci-header]:p-0 [&_.cci-header_img]:my-0 [&_.cci-header_img]:w-full [&_.cci-header_img]:rounded-none [&_.cci-header_p]:px-5 [&_.cci-header_p]:py-3 md:[&_.cci-header_p]:px-7 [&_a]:font-medium [&_blockquote]:border-l-4 [&_blockquote]:border-spark [&_blockquote]:bg-accent-subtle/50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-1 [&_ol]:list-decimal [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
