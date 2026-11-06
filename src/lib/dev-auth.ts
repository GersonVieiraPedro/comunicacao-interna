const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function hostnameFromAuthUrl(authUrl: string | undefined): string | null {
  if (!authUrl) return null;
  try {
    return new URL(authUrl).hostname;
  } catch {
    return null;
  }
}

/** Edge-safe: only process.env. Never true em produção. */
export function isLocalDevBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.AUTH_DEV_BYPASS !== "true" && process.env.AUTH_ALLOW_DEV_LOGIN !== "true") {
    return false;
  }
  const host = hostnameFromAuthUrl(process.env.AUTH_URL);
  return host !== null && LOCAL_HOSTS.has(host);
}

export function isEntraConfigured(): boolean {
  const id = process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.trim() ?? "";
  const secret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.trim() ?? "";
  const issuer = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.trim() ?? "";
  if (!id || !secret || !issuer) return false;
  if (id === "local-dev" || secret === "local-dev") return false;
  return true;
}

export const LOCAL_DEV_PERSONAS = {
  collaborator: {
    entraObjectId: "local-dev-collaborator",
    email: "colaborador.local@localhost",
    displayName: "Colaborador local",
    persona: "collaborator" as const,
  },
  communicator: {
    entraObjectId: "local-dev-communicator",
    email: "comunicador.local@localhost",
    displayName: "Comunicador local",
    persona: "communicator" as const,
  },
};

export type LocalDevPersona = keyof typeof LOCAL_DEV_PERSONAS;
