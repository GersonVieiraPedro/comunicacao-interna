import { auth } from "@/auth";
import { getAdminDashboard } from "@/services/communication-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommunicationStatus } from "@/types/communication";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { CalendarClock, Plus } from "lucide-react";
import { formatBrazilDateTime } from "@/lib/datetime";

export default async function AdminHomePage() {
  const session = await auth();
  const data = await getAdminDashboard(session?.user);

  const cards = [
    { label: "Total", value: data.total, href: "/admin/comunicados" },
    {
      label: "Publicados",
      value: data.counts[CommunicationStatus.PUBLISHED] ?? 0,
      href: "/admin/comunicados?status=PUBLISHED",
    },
    {
      label: "Rascunhos",
      value: data.counts[CommunicationStatus.DRAFT] ?? 0,
      href: "/admin/comunicados?status=DRAFT",
    },
    {
      label: "Agendados",
      value: data.counts[CommunicationStatus.SCHEDULED] ?? 0,
      href: "/admin/agenda",
    },
    { label: "Colaboradores", value: data.eligible, href: "/admin/comunicados" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administração"
        description="Publicação, agenda e leitura dos comunicados."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/agenda"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-muted"
            >
              <Icon icon={CalendarClock} />
              Agenda
            </Link>
            <Link
              href="/admin/comunicados/novo"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              <Icon icon={Plus} />
              Novo comunicado
            </Link>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition hover:border-accent/30">
              <p className="text-sm text-fg-muted">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">{card.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-fg-muted">Próximos na agenda</h2>
          <Link href="/admin/agenda" className="text-sm font-medium text-accent underline">
            Ver agenda completa
          </Link>
        </div>
        {data.agenda.length === 0 ? (
          <Card>
            <p className="text-sm text-fg-muted">Nenhum comunicado agendado no momento.</p>
          </Card>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {data.agenda.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge tone={item.isDue ? "warning" : "info"}>
                      {item.isDue ? "Pronto para publicar" : "Agendado"}
                    </Badge>
                  </div>
                  <Link href={`/admin/comunicados/${item.id}`} className="font-medium text-accent hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-xs text-fg-muted">
                    {item.scheduledPublishAt ? formatBrazilDateTime(item.scheduledPublishAt) : "—"}
                  </p>
                </div>
                <Link
                  href={`/admin/comunicados/${item.id}`}
                  className="text-sm font-semibold text-fg underline-offset-2 hover:underline"
                >
                  Revisar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Menor taxa de visualização</h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {data.lowest.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link href={`/admin/comunicados/${item.id}`} className="text-accent hover:underline">
                {item.title}
              </Link>
              <span>
                {item.readCount} · {item.percent}%
              </span>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/admin/comunicados" className="text-sm text-accent underline">
        Ver todos os comunicados
      </Link>
    </div>
  );
}
