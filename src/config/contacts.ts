import { institutionalLinks } from "@/config/institutional";

/** Canais de atendimento por perfil (deep links; sem WhatsApp API). */
export const contactConfig = {
  csWhatsappUrl:
    process.env.NEXT_PUBLIC_CS_WHATSAPP_URL ??
    `https://wa.me/${institutionalLinks.phoneE164}`,
  csEmail: process.env.NEXT_PUBLIC_CS_EMAIL ?? "cs@metarh.com.br",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "atendimento@metarh.com.br",
  marketingEmail: process.env.NEXT_PUBLIC_MARKETING_EMAIL ?? "marketing@metarh.com.br",
} as const;
