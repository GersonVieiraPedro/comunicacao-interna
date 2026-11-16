import { PageHeader } from "@/components/layout/page-header";
import { InstitutionalLinks } from "@/components/institutional/institutional-links";
import { contactConfig } from "@/config/contacts";
import { institutionalLinks } from "@/config/institutional";
import { Card } from "@/components/ui/card";
import { ActionBar, ButtonLink } from "@/components/ui/button";

export default function ContatoCsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Customer Success"
        description="Canal direto com o time de CS da METARH via WhatsApp ou e-mail."
      />
      <InstitutionalLinks compact showFacebook={false} />
      <Card className="flex flex-col gap-4">
        <ActionBar>
          <ButtonLink href={contactConfig.csWhatsappUrl}>
            Abrir WhatsApp ({institutionalLinks.phoneDisplay})
          </ButtonLink>
          <ButtonLink href={`mailto:${contactConfig.csEmail}`} variant="secondary">
            {contactConfig.csEmail}
          </ButtonLink>
        </ActionBar>
      </Card>
    </div>
  );
}
