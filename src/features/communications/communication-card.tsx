import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommunicationPriority } from "@/types/communication";
import { cn } from "@/lib/cn";

export function CommunicationCard({
  id,
  title,
  summary,
  category,
  publishedAt,
  unread,
  priority,
  coverUrl,
  featured = false,
}: {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: Date | string | null;
  unread: boolean;
  priority: string;
  coverUrl?: string | null;
  featured?: boolean;
}) {
  const dateLabel = publishedAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(publishedAt))
    : "";
  const urgent = priority === CommunicationPriority.URGENT;

  return (
    <Link href={`/comunicados/${id}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
      <Card
        className={cn(
          "overflow-hidden p-0",
          urgent && "border-l-4 border-l-danger",
          featured && "md:grid md:grid-cols-[16rem_1fr]",
        )}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className={cn("h-40 w-full object-cover", featured && "md:h-full")} />
        ) : (
          <div
            className={cn(
              "relative h-28 w-full overflow-hidden bg-accent-subtle",
              featured && "md:h-full md:min-h-40",
            )}
          >
            <span className="absolute bottom-0 left-0 h-1 w-full bg-spark" aria-hidden />
          </div>
        )}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{category}</Badge>
            {unread ? <Badge tone="warning">Não visualizado</Badge> : null}
            {priority === CommunicationPriority.IMPORTANT ? <Badge tone="warning">Importante</Badge> : null}
            {urgent ? <Badge tone="danger">Urgente</Badge> : null}
          </div>
          <h2 className={cn("mt-2 font-semibold text-fg", featured ? "text-xl" : "text-base")}>{title}</h2>
          <p className="mt-1 text-sm text-fg-muted">{summary}</p>
          <p className="mt-2 text-xs text-fg-muted">{dateLabel}</p>
        </div>
      </Card>
    </Link>
  );
}
