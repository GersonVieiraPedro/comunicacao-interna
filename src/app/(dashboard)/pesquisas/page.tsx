import { PageHeader } from "@/components/layout/page-header";
import { InstitutionalLinks } from "@/components/institutional/institutional-links";
import { surveyLinks } from "@/config/surveys";
import { Card } from "@/components/ui/card";

export default function PesquisasPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Pesquisas" description="NPS e CSAT — links externos configuráveis." />
      <InstitutionalLinks compact showFacebook={false} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-fg">NPS</h2>
          {surveyLinks.nps ? (
            <a
              href={surveyLinks.nps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-accent"
            >
              Responder pesquisa NPS
            </a>
          ) : (
            <p className="mt-2 text-sm text-fg-muted">
              Configure `NEXT_PUBLIC_SURVEY_NPS_URL` para habilitar.
            </p>
          )}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-fg">CSAT</h2>
          {surveyLinks.csat ? (
            <a
              href={surveyLinks.csat}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-accent"
            >
              Responder pesquisa CSAT
            </a>
          ) : (
            <p className="mt-2 text-sm text-fg-muted">
              Configure `NEXT_PUBLIC_SURVEY_CSAT_URL` para habilitar.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
