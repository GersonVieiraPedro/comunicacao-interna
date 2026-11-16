export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "METARH NEWS",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? "METARH NEWS",
  brand: "METARH",
  schema: process.env.APP_DB_SCHEMA ?? "comunicacao",
} as const;
