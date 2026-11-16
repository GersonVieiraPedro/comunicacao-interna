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

const TENANT_GUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TENANT_ALIASES = new Set(["common", "organizations", "consumers"]);

/** Issuer Entra válido: https://login.microsoftonline.com/{tenant}/v2.0 */
export function isValidEntraIssuer(issuer: string): boolean {
  try {
    const url = new URL(issuer.trim());
    if (!url.hostname.endsWith("microsoftonline.com") && !url.hostname.endsWith("windows.net")) {
      return false;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2 || parts[1]?.toLowerCase() !== "v2.0") return false;
    const tenant = parts[0] ?? "";
    if (TENANT_GUID.test(tenant) || TENANT_ALIASES.has(tenant.toLowerCase())) return true;
    // domínio verificado do tenant (ex.: contoso.onmicrosoft.com)
    return tenant.includes(".");
  } catch {
    return false;
  }
}

export function isEntraConfigured(): boolean {
  const id = process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.trim() ?? "";
  const secret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.trim() ?? "";
  const issuer = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.trim() ?? "";
  if (!id || !secret || !issuer) return false;
  if (id === "local-dev" || secret === "local-dev") return false;
  return isValidEntraIssuer(issuer);
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
