import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { InstitutionalLinks } from "@/components/institutional/institutional-links";
import { Card } from "@/components/ui/card";
import { FaqAdminPanel } from "@/features/content/faq-admin-panel";
import { getFaqAdminData, getFaqPageData } from "@/services/content-service";
import { hasMetarhRole } from "@/types/roles";
import { contactConfig } from "@/config/contacts";

export default async function FaqPage() {
  const session = await auth();
  const canManage = hasMetarhRole(session?.user?.roles ?? []);
  const data = canManage
    ? await getFaqAdminData(session?.user)
    : await getFaqPageData(session?.user);

  const visibleFaqs = data.faqs.filter((item) => item.active);
  const visibleLinks = data.links.filter((item) => item.active);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="FAQ e links úteis"
        description="Perguntas frequentes e atalhos institucionais para toda a base."
      />
      <InstitutionalLinks compact showFacebook={false} />

      <section className="space-y-3" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-sm font-semibold text-fg">
          Perguntas frequentes
        </h2>
        {visibleFaqs.length === 0 ? (
          <Card>
            <p className="text-sm text-fg-muted">Nenhuma pergunta publicada no momento.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleFaqs.map((item) => (
              <li key={item.id}>
                <Card>
                  <h3 className="text-sm font-semibold text-fg">{item.question}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-fg-muted">{item.answer}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="links-heading">
        <h2 id="links-heading" className="text-sm font-semibold text-fg">
          Links úteis
        </h2>
        <Card>
          <h3 className="text-sm font-semibold text-fg">Atendimento</h3>
          <a
            href={`mailto:${contactConfig.supportEmail}`}
            className="mt-2 inline-block text-sm font-medium text-accent"
          >
            {contactConfig.supportEmail}
          </a>
        </Card>
        {visibleLinks.length === 0 ? (
          <Card>
            <p className="text-sm text-fg-muted">Nenhum link publicado no momento.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleLinks.map((link) => (
              <li key={link.id}>
                <Card>
                  <a
                    href={link.href}
                    target={link.href.startsWith("mailto:") || link.href.startsWith("tel:") ? undefined : "_blank"}
                    rel={
                      link.href.startsWith("mailto:") || link.href.startsWith("tel:")
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="text-sm font-semibold text-accent"
                  >
                    {link.label}
                  </a>
                  {link.description ? (
                    <p className="mt-1 text-sm text-fg-muted">{link.description}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage ? <FaqAdminPanel faqs={data.faqs} links={data.links} /> : null}
    </div>
  );
}
