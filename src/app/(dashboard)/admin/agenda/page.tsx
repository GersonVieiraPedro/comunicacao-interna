import Link from "next/link";
import { CalendarClock, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { getAdminAgenda } from "@/services/communication-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatBrazilDateTime } from "@/lib/datetime";

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

export default async function AdminAgendaPage() {
  const session = await auth();
  const items = await getAdminAgenda(session?.user);

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    if (!item.scheduledPublishAt) continue;
    const key = dayKey(item.scheduledPublishAt);
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Agenda de publicações"
        description="Comunicados agendados, prontos para revisão e ajuste antes do disparo."
        actions={
          <Link
            href="/admin/comunicados/novo"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Novo comunicado
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nada agendado"
          description="Quando você agendar um comunicado, ele aparece aqui para o time revisar."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([key, group]) => {
            const first = group[0]?.scheduledPublishAt;
            return (
              <section key={key} className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold capitalize text-fg">
                  {first ? dayLabel(first) : key}
                </h2>
                <ul className="flex flex-col gap-3">
                  {group.map((item) => (
                    <li key={item.id}>
                      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge tone={item.isDue ? "warning" : "info"}>
                              {item.isDue ? "Pronto para publicar" : "Agendado"}
                            </Badge>
                            <Badge tone="neutral">{item.category.name}</Badge>
                            <Badge tone="neutral">{item.priority}</Badge>
                          </div>
                          <Link
                            href={`/admin/comunicados/${item.id}`}
                            className="block truncate text-base font-semibold text-fg hover:text-accent"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1 text-sm text-fg-muted">
                            {item.scheduledPublishAt
                              ? formatBrazilDateTime(item.scheduledPublishAt)
                              : "Sem data"}{" "}
                            · {item.author.displayName}
                          </p>
                          {item.summary ? (
                            <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{item.summary}</p>
                          ) : null}
                        </div>
                        <Link
                          href={`/admin/comunicados/${item.id}`}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-fg hover:border-accent/30 hover:bg-muted"
                        >
                          <Icon icon={Pencil} className="h-4 w-4" />
                          Revisar / editar
                        </Link>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
