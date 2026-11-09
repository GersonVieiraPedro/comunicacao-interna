import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { isEntraConfigured } from "@/lib/dev-auth";

const entraProviders = isEntraConfigured()
  ? [
      MicrosoftEntraID({
        clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
        issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
        authorization: { params: { scope: "openid profile email" } },
      }),
    ]
  : [];

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: entraProviders,
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const isPublic =
        path.startsWith("/login") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/health") ||
        path.startsWith("/api/cron") ||
        path === "/sw.js" ||
        path === "/manifest.webmanifest" ||
        path.startsWith("/icons/");
      if (isPublic) return true;
      return Boolean(session?.user);
    },
  },
} satisfies NextAuthConfig;
