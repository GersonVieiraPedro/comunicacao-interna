import { auth } from "@/auth";
import { getCommunicationMetrics } from "@/services/communication-service";
import { categoriesForUi } from "@/services/communication-service";
import { CommunicationEditor } from "@/features/communications/communication-editor";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommunicationStatus } from "@/types/communication";
import { formatBrazilDateTime } from "@/lib/datetime";
import Link from "next/link";

export default async function AdminCommunicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [{ item, metrics, delivery, readers }, categories] = await Promise.all([
    getCommunicationMetrics(session?.user, id),
    categoriesForUi(),
  ]);
  const editable = item.status === CommunicationStatus.DRAFT || item.status === CommunicationStatus.SCHEDULED;

  const metricCards = [
    { label: "Elegíveis", value: metrics.eligibleCount },
    { label: "Receberam (in-app)", value: metrics.deliveredCount, hint: `${metrics.percentDelivered}%` },
    { label: "Visualizaram", value: metrics.viewedCount, hint: `${metrics.percentViewed}%` },
    { label: "Abriram notificação", value: metrics.openedCount, hint: `${metrics.percentOpened}%` },
    { label: "Confirmaram ciência", value: metrics.acknowledgedCount, hint: `${metrics.percentAcknowledged}%` },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title={item.title} description={`Status: ${item.status}`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => (
          <Card key={card.label}>
            <p className="text-sm text-fg-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
            {card.hint ? <p className="mt-1 text-xs text-fg-muted">{card.hint} dos elegíveis</p> : null}
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-medium text-fg">Entregas</p>
        <p className="mt-2 text-sm text-fg-muted">
          In-app: {delivery.inApp} · Push enviado: {delivery.pushSent} · Push falhou: {delivery.pushFailed}
        </p>
        {item.status === CommunicationStatus.PUBLISHED ? (
          <p className="mt-2 text-sm">
            <Link href={`/comunicados/${item.id}`} className="text-accent underline">
              Ver como colaborador
            </Link>
          </p>
        ) : null}
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Por colaborador</h2>
        {readers.length === 0 ? (
          <Card>
            <p className="text-sm text-fg-muted">Nenhuma visualização registrada ainda.</p>
          </Card>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {readers.map((reader) => (
              <li key={reader.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{reader.user.displayName}</p>
                  <p className="truncate text-xs text-fg-muted">{reader.user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{`Viu ${formatBrazilDateTime(reader.firstViewedAt)}`}</Badge>
                  {reader.acknowledgedAt ? (
                    <Badge tone="success">{`Ciência ${formatBrazilDateTime(reader.acknowledgedAt)}`}</Badge>
                  ) : (
                    <Badge tone="warning">Sem confirmação</Badge>
                  )}
                  <span className="text-xs text-fg-muted">{reader.viewCount}x</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editable ? (
        <CommunicationEditor
          categories={categories}
          initial={{
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            summary: item.summary,
            bodyHtml: item.bodyHtml,
            categoryId: item.categoryId,
            priority: item.priority,
            status: item.status,
            coverPath: item.coverPath,
            scheduledPublishAt: item.scheduledPublishAt,
            expiresAt: item.expiresAt,
          }}
        />
      ) : (
        <p className="text-sm text-fg-muted">Comunicados publicados, expirados ou cancelados não são editados no MVP.</p>
      )}
    </div>
  );
}
