import Link from "next/link";
import { ArrowUpRight, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
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
  const important = priority === CommunicationPriority.IMPORTANT;

  return (
    <Link
      href={`/comunicados/${id}`}
      className="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Card
        className={cn(
          "overflow-hidden border-border/80 p-0 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-accent/25 group-hover:shadow",
          urgent && "ring-1 ring-danger/30",
          featured && "md:grid md:grid-cols-[15rem_1fr]",
        )}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className={cn(
              "h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]",
              featured && "md:h-full",
            )}
          />
        ) : (
          <div
            className={cn(
              "relative flex h-28 w-full items-end overflow-hidden bg-gradient-to-br from-accent via-accent-hover to-[#2d0057] p-4",
              featured && "md:h-full md:min-h-44",
            )}
          >
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-spark/25 blur-2xl" aria-hidden />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-spark" aria-hidden />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
              <Icon icon={Megaphone} className="h-5 w-5" />
            </span>
          </div>
        )}
        <div className="flex flex-col gap-3 p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{category}</Badge>
            {unread ? <Badge tone="warning">Novo</Badge> : null}
            {important ? <Badge tone="warning">Importante</Badge> : null}
            {urgent ? <Badge tone="danger">Urgente</Badge> : null}
          </div>
          <div>
            <h2
              className={cn(
                "font-semibold tracking-tight text-fg transition-colors group-hover:text-accent",
                featured ? "text-xl md:text-2xl" : "text-base md:text-lg",
              )}
            >
              {title}
            </h2>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-fg-muted">{summary}</p>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <p className="text-xs font-medium text-fg-muted">{dateLabel}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100">
              Abrir
              <Icon icon={ArrowUpRight} className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
