import { auth } from "@/auth";
import { getCommunicationForCollaborator, acknowledgeRead } from "@/services/communication-service";
import { RichText } from "@/features/communications/rich-text";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { CommunicationPriority } from "@/types/communication";
import { markNotificationsForCommunication } from "@/repositories/notification-repository";
import { mediaSrc } from "@/lib/media-url";

export default async function CommunicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const { item, userId } = await getCommunicationForCollaborator(session?.user, id);
  await acknowledgeRead(session?.user, id);
  await markNotificationsForCommunication(userId, id);

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-5">
        <p className="text-sm text-fg-muted">
        {item.publishedAt
          ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(item.publishedAt)
          : null}{" "}
        · {item.author.displayName}
      </p>
      {mediaSrc(item.coverPath) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaSrc(item.coverPath) ?? undefined}
          alt=""
          className="max-h-80 w-full rounded-2xl object-cover shadow-sm"
        />
      ) : (
        <div className="h-2 w-24 rounded-full bg-spark" aria-hidden />
      )}
      <PageHeader title={item.title} description={item.subtitle ?? undefined} eyebrow={item.category.name} />
      <div className="flex flex-wrap gap-2">
        <Badge tone="info">{item.category.name}</Badge>
        {item.priority === CommunicationPriority.URGENT ? <Badge tone="danger">Urgente</Badge> : null}
        {item.priority === CommunicationPriority.IMPORTANT ? <Badge tone="warning">Importante</Badge> : null}
      </div>


      {item.summary ? (
        <div className="flex flex-col gap-1">
          <p className="pl-2 text-sm text-fg-muted">Resumo</p>
          <Card>
            <RichText html={item.summary} />
          </Card>
        </div>
      ) : null}
      <Card className="overflow-hidden p-0">
        <RichText html={item.bodyHtml} />
      </Card>
    </article>
  );
}
