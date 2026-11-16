import { auth } from "@/auth";
import { getAdminDashboard } from "@/services/communication-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommunicationStatus } from "@/types/communication";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatBrazilDateTime } from "@/lib/datetime";
import { AdminDashboardCharts } from "@/features/admin/admin-dashboard-charts";

export default async function AdminHomePage() {
  const session = await auth();
  const data = await getAdminDashboard(session?.user);

  const cards = [
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
    {
      label: "Usuários ativos",
      value: data.activeUsers,
      href: "/admin/usuarios",
    },
    {
      label: "Com push ativo",
      value: data.pushUsers,
      href: "/admin/usuarios?push=1",
      hint: `${data.pushDevices} dispositivo(s)`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Painel"
        description="Visão geral de publicação e engajamento. Agenda e usuários ficam no menu lateral."
        actions={
          <ButtonLink href="/admin/comunicados/novo">
            <Icon icon={Plus} />
            Novo comunicado
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="h-full transition hover:border-accent/30">
              <p className="text-sm text-fg-muted">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
              {"hint" in card && card.hint ? (
                <p className="mt-1 text-xs text-fg-muted">{card.hint}</p>
              ) : null}
            </Card>
          </Link>
        ))}
      </div>

      <AdminDashboardCharts
        statusCounts={data.counts}
        byDay={data.byDay}
        funnel={data.funnel}
        lowest={data.lowest}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">Próximos na agenda</h2>
          <Link href="/admin/agenda" className="text-sm font-medium text-accent hover:underline">
            Ver agenda
          </Link>
        </div>
        {data.agenda.length === 0 ? (
          <Card>
            <p className="text-sm text-fg-muted">Nenhum comunicado agendado no momento.</p>
          </Card>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
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
    </div>
  );
}
