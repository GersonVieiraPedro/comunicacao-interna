/** Pesquisas externas (NPS/CSAT). URLs vazias ocultam o bloco. */
export const surveyLinks = {
  nps: process.env.NEXT_PUBLIC_SURVEY_NPS_URL ?? "",
  csat: process.env.NEXT_PUBLIC_SURVEY_CSAT_URL ?? "",
} as const;
