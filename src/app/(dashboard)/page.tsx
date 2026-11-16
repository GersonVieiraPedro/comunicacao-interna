import { getHomeData } from "@/services/communication-service";
import { auth } from "@/auth";
import { CommunicationCard } from "@/features/communications/communication-card";
import { UnreadCommunicationModal } from "@/features/communications/unread-modal";
import { PushPrompt } from "@/components/pwa/push-prompt";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { InstitutionalLinks } from "@/components/institutional/institutional-links";
import { Megaphone } from "lucide-react";
import { mediaSrc } from "@/lib/media-url";
import { AppRole } from "@/types/roles";
import { institutionalLinks } from "@/config/institutional";
import { contactConfig } from "@/config/contacts";
import { surveyLinks } from "@/config/surveys";
import { Card } from "@/components/ui/card";
import { ActionBar, ButtonLink } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  const data = await getHomeData(session?.user);
  const firstName = session?.user?.name?.split(/\s+/)[0] ?? "olá";
  const effectiveRole = data.effectiveRole ?? session?.user?.effectiveRole;

  if (effectiveRole === AppRole.CANDIDATE) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-7">
        <PageHeader
          eyebrow="Candidato"
          title={`Oi, ${firstName}`}
          description="Acompanhe as redes METARH e as vagas abertas no Selecty."
        />
        <InstitutionalLinks />
        <Card className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-fg">Vagas Selecty</h2>
          <p className="text-sm text-fg-muted">
            Sem contrato ativo, seu acesso prioriza oportunidades publicadas pela METARH.
          </p>
          <ActionBar>
            <ButtonLink href={institutionalLinks.selecty}>Ver vagas no Selecty</ButtonLink>
            <ButtonLink href="/vagas" variant="secondary">
              Abrir página de vagas
            </ButtonLink>
          </ActionBar>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow={effectiveRole === AppRole.CLIENT ? "Cliente" : "Central"}
        title={`Oi, ${firstName}`}
        description={
          effectiveRole === AppRole.CLIENT
            ? "Comunicados dos seus alocados, canais de CS e pesquisas."
            : "Acesse aqui os comunicados publicados para você, no celular ou no computador."
        }
      />
      <InstitutionalLinks compact showFacebook={false} />
      {effectiveRole === AppRole.CLIENT ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <h2 className="text-center text-sm font-semibold text-fg sm:text-left">Fale com o CS</h2>
            <ActionBar>
              <ButtonLink href={contactConfig.csWhatsappUrl}>WhatsApp</ButtonLink>
              <ButtonLink href={`mailto:${contactConfig.csEmail}`} variant="secondary">
                E-mail CS
              </ButtonLink>
            </ActionBar>
          </Card>
          <Card className="flex flex-col gap-3">
            <h2 className="text-center text-sm font-semibold text-fg sm:text-left">Pesquisas</h2>
            <ActionBar>
              {surveyLinks.nps ? (
                <ButtonLink href={surveyLinks.nps} variant="secondary">
                  Responder NPS
                </ButtonLink>
              ) : (
                <p className="w-full text-center text-xs text-fg-muted sm:text-left">NPS em configuração</p>
              )}
              {surveyLinks.csat ? (
                <ButtonLink href={surveyLinks.csat} variant="secondary">
                  Responder CSAT
                </ButtonLink>
              ) : (
                <p className="w-full text-center text-xs text-fg-muted sm:text-left">CSAT em configuração</p>
              )}
            </ActionBar>
          </Card>
        </div>
      ) : null}
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
            coverUrl={mediaSrc(data.featured.coverPath)}
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
                coverUrl={mediaSrc(item.coverPath)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
