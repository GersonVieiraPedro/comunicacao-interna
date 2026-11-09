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
  const firstName = session?.user?.name?.split(/\s+/)[0] ?? "olá";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Central"
        title={`Oi, ${firstName}`}
        description="Aqui ficam os avisos importantes da empresa — claros, no celular e no computador."
      />
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
        <section aria-labelledby="destaque" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 id="destaque" className="text-sm font-semibold text-fg">
              Em destaque
            </h2>
            {data.latest.length > 0 ? (
              <p className="text-xs text-fg-muted">{data.latest.length} recentes abaixo</p>
            ) : null}
          </div>
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
        <section aria-labelledby="ultimos" className="space-y-3">
          <h2 id="ultimos" className="text-sm font-semibold text-fg">
            Últimos comunicados
          </h2>
          <div className="flex flex-col gap-3.5">
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
