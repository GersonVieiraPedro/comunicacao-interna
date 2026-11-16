/**
 * Links institucionais MetaRH (referência: metarh.com.br / Selecty).
 * Overrides opcionais via NEXT_PUBLIC_* para ambientes de teste.
 */
export const institutionalLinks = {
  site: process.env.NEXT_PUBLIC_METARH_SITE_URL ?? "https://metarh.com.br/",
  instagram:
    process.env.NEXT_PUBLIC_METARH_INSTAGRAM_URL ?? "https://www.instagram.com/metarhconsultoria/",
  linkedin:
    process.env.NEXT_PUBLIC_METARH_LINKEDIN_URL ??
    "https://www.linkedin.com/company/metarhconsultoria/",
  youtube:
    process.env.NEXT_PUBLIC_METARH_YOUTUBE_URL ?? "https://www.youtube.com/@metarhconsultoria",
  facebook:
    process.env.NEXT_PUBLIC_METARH_FACEBOOK_URL ?? "https://www.facebook.com/metarhconsultoria",
  selecty:
    process.env.NEXT_PUBLIC_METARH_SELECTY_URL ?? "https://metarh.selecty.com.br/",
  phoneDisplay: process.env.NEXT_PUBLIC_METARH_PHONE_DISPLAY ?? "+55 11 5525 2711",
  phoneE164: process.env.NEXT_PUBLIC_METARH_PHONE_E164 ?? "551155252711",
} as const;

export type InstitutionalLinkKey = keyof typeof institutionalLinks;
