import { auth } from "@/auth";
import { getCommunicationForCollaborator, acknowledgeRead } from "@/services/communication-service";
import { RichText } from "@/features/communications/rich-text";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CommunicationPriority } from "@/types/communication";
import { markNotificationsForCommunication } from "@/repositories/notification-repository";

export default async function CommunicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const { item, userId } = await getCommunicationForCollaborator(session?.user, id);
  await acknowledgeRead(session?.user, id);
  await markNotificationsForCommunication(userId, id);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <Breadcrumbs items={[{ href: "/", label: "Início" }, { label: item.title }]} />
      <PageHeader title={item.title} description={item.subtitle ?? item.summary} />
      <div className="flex flex-wrap gap-2">
        <Badge tone="info">{item.category.name}</Badge>
        {item.priority === CommunicationPriority.URGENT ? <Badge tone="danger">Urgente</Badge> : null}
        {item.priority === CommunicationPriority.IMPORTANT ? <Badge tone="warning">Importante</Badge> : null}
      </div>
      {item.coverPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/media/${item.coverPath}`} alt="" className="max-h-72 w-full rounded object-cover" />
      ) : null}
      <p className="text-sm text-fg-muted">
        {item.publishedAt
          ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(item.publishedAt)
          : null}{" "}
        · {item.author.displayName}
      </p>
      <RichText html={item.bodyHtml} />
    </article>
  );
}
