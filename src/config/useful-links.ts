import { institutionalLinks } from "@/config/institutional";
import { contactConfig } from "@/config/contacts";

export type UsefulLink = { id: string; label: string; href: string; description?: string };

export const usefulLinks: UsefulLink[] = [
  {
    id: "site",
    label: "Site MetaRH",
    href: institutionalLinks.site,
    description: "Institucional e soluções",
  },
  {
    id: "selecty",
    label: "Portal de vagas (Selecty)",
    href: institutionalLinks.selecty,
    description: "Oportunidades publicadas",
  },
  {
    id: "blog",
    label: "Blog / MetaNews",
    href: "https://metarh.com.br/metarhnews/",
  },
  {
    id: "email-atendimento",
    label: "E-mail de atendimento",
    href: `mailto:${contactConfig.supportEmail}`,
  },
];
