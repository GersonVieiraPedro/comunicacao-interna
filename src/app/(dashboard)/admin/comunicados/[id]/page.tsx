import { auth } from "@/auth";
import { getCommunicationMetrics } from "@/services/communication-service";
import { categoriesForUi } from "@/services/communication-service";
import { CommunicationEditor } from "@/features/communications/communication-editor";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CommunicationStatus } from "@/types/communication";
import Link from "next/link";

export default async function AdminCommunicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [{ item, metrics }, categories] = await Promise.all([
    getCommunicationMetrics(session?.user, id),
    categoriesForUi(),
  ]);
  const editable = item.status === CommunicationStatus.DRAFT || item.status === CommunicationStatus.SCHEDULED;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title={item.title} description={`Status: ${item.status}`} />
      <Card>
        <p className="text-sm text-fg-muted">Métricas (derivadas do banco)</p>
        <p className="mt-2 text-sm">
          Elegíveis: {metrics.eligibleCount} · Visualizaram: {metrics.readCount} · Não visualizaram:{" "}
          {metrics.unreadCount} · {metrics.percentRead}%
        </p>
        {item.status === CommunicationStatus.PUBLISHED ? (
          <p className="mt-2 text-sm">
            <Link href={`/comunicados/${item.id}`} className="text-accent underline">
              Ver como colaborador
            </Link>
          </p>
        ) : null}
      </Card>
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
