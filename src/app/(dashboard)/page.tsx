import { getHomeData } from "@/services/communication-service";
import { auth } from "@/auth";
import { CommunicationCard } from "@/features/communications/communication-card";
import { UnreadCommunicationModal } from "@/features/communications/unread-modal";
import { PushPrompt } from "@/components/pwa/push-prompt";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Megaphone } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const data = await getHomeData(session?.user);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Início" description="Comunicados publicados para todos os colaboradores." />
      <InstallAppCard />
      <PushPrompt />
      {data.popup ? (
        <UnreadCommunicationModal
          communication={{
            id: data.popup.id,
            title: data.popup.title,
            summary: data.popup.summary,
            priority: data.popup.priority,
            categoryName: data.popup.category.name,
          }}
        />
      ) : null}
      {data.featured ? (
        <section aria-labelledby="destaque">
          <h2 id="destaque" className="mb-3 text-sm font-medium text-fg-muted">
            Destaque
          </h2>
          <CommunicationCard
            featured
            id={data.featured.id}
            title={data.featured.title}
            summary={data.featured.summary}
            category={data.featured.category.name}
            publishedAt={data.featured.publishedAt}
            unread={!data.readIds.has(data.featured.id)}
            priority={data.featured.priority}
            coverUrl={data.featured.coverPath ? `/api/media/${data.featured.coverPath}` : null}
          />
        </section>
      ) : (
        <EmptyState
          title="Nenhum comunicado publicado"
          description="Quando a comunicação publicar, os avisos aparecem aqui."
          icon={Megaphone}
        />
      )}
      {data.latest.length > 0 ? (
        <section aria-labelledby="ultimos">
          <h2 id="ultimos" className="mb-3 text-sm font-medium text-fg-muted">
            Últimos comunicados
          </h2>
          <div className="flex flex-col gap-3">
            {data.latest.map((item) => (
              <CommunicationCard
                key={item.id}
                id={item.id}
                title={item.title}
                summary={item.summary}
                category={item.category.name}
                publishedAt={item.publishedAt}
                unread={!data.readIds.has(item.id)}
                priority={item.priority}
                coverUrl={item.coverPath ? `/api/media/${item.coverPath}` : null}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
