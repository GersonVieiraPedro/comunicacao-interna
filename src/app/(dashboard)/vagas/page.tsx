import { PageHeader } from "@/components/layout/page-header";
import { InstitutionalLinks } from "@/components/institutional/institutional-links";
import { institutionalLinks } from "@/config/institutional";
import { Card } from "@/components/ui/card";
import { ActionBar, ButtonLink } from "@/components/ui/button";

export default function VagasPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Vagas Selecty"
        description="Oportunidades publicadas pela METARH no portal Selecty."
      />
      <InstitutionalLinks />
      <Card className="flex flex-col gap-4">
        <p className="text-center text-sm text-fg-muted sm:text-left">
          Abrimos o portal oficial de vagas. Não há sincronização automática neste ciclo — o link
          aponta para o Selecty METARH.
        </p>
        <ActionBar>
          <ButtonLink href={institutionalLinks.selecty}>Abrir metarh.selecty.com.br</ButtonLink>
        </ActionBar>
        <div className="overflow-hidden rounded-xl border border-border">
          <iframe
            title="Vagas METARH Selecty"
            src={institutionalLinks.selecty}
            className="h-[28rem] w-full bg-white"
          />
        </div>
      </Card>
    </div>
  );
}
