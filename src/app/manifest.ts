import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: "Central",
    description: "Central de Comunicação Interna",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4fb",
    theme_color: "#470082",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
