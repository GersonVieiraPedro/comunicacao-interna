import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { logger } from "@/lib/logger";
import {
  authenticatePasswordUser,
  resolveSessionUser,
  syncLocalDevUser,
  syncSessionUser,
} from "@/services/identity-service";
import type { SessionUser } from "@/lib/authz";
import { AppRole } from "@/types/roles";
import { authConfig } from "@/auth.config";
import { isLocalDevBypassEnabled, LOCAL_DEV_PERSONAS, type LocalDevPersona } from "@/lib/dev-auth";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    roles?: SessionUser["roles"];
    contractStatus?: SessionUser["contractStatus"];
    effectiveRole?: SessionUser["effectiveRole"];
  }
}

type TokenWithUser = { appUser?: SessionUser };

function groupsFromProfile(profile: unknown): string[] {
  if (!profile || typeof profile !== "object") return [];
  const groups = (profile as { groups?: unknown }).groups;
  if (!Array.isArray(groups)) return [];
  return groups.filter((item): item is string => typeof item === "string");
}

function localPersona(value: unknown): LocalDevPersona {
  return value === "communicator" ? "communicator" : "collaborator";
}

const credentialsProvider = Credentials({
  id: "credentials",
  name: "E-mail e senha",
  credentials: {
    email: { label: "E-mail", type: "email" },
    password: { label: "Senha", type: "password" },
  },
  async authorize(credentials) {
    const email = typeof credentials?.email === "string" ? credentials.email : "";
    const password = typeof credentials?.password === "string" ? credentials.password : "";
    try {
      const user = await authenticatePasswordUser(email, password);
      if (!user) {
        logger.warn("credentials_signin_rejected", {
          email: email.trim().toLowerCase().slice(0, 120) || "(vazio)",
        });
        return null;
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        contractStatus: user.contractStatus,
        effectiveRole: user.effectiveRole,
      };
    } catch (error) {
      logger.error("credentials_authorize_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },
});

const localDevProvider = Credentials({
  id: "local-dev",
  name: "Local development",
  credentials: {
    persona: { label: "Persona", type: "text" },
  },
  authorize(credentials) {
    if (!isLocalDevBypassEnabled()) return null;
    const persona = localPersona(credentials?.persona);
    const profile = LOCAL_DEV_PERSONAS[persona];
    return {
      id: profile.entraObjectId,
      email: profile.email,
      name: profile.displayName,
    };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, credentialsProvider, localDevProvider],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile, user }) {
      const typed = token as typeof token & TokenWithUser;

      if (account?.provider === "credentials" && user?.id) {
        typed.appUser = {
          id: user.id,
          email: user.email ?? "",
          name: user.name ?? user.email ?? "",
          roles: user.roles?.length ? user.roles : [AppRole.COLLABORATOR],
          contractStatus: user.contractStatus ?? null,
          effectiveRole: user.effectiveRole,
        };
        return typed;
      }

      if (account?.provider === "local-dev" && user?.id) {
        try {
          const persona: LocalDevPersona =
            user.id === LOCAL_DEV_PERSONAS.communicator.entraObjectId
              ? "communicator"
              : "collaborator";
          typed.appUser = await syncLocalDevUser(persona);
        } catch (error) {
          logger.error("local_dev_sync_failed", { error: String(error) });
          return typed;
        }
        return typed;
      }

      if (account && profile) {
        const oid =
          typeof profile.oid === "string"
            ? profile.oid
            : typeof profile.sub === "string"
              ? profile.sub
              : "";
        const email =
          typeof profile.email === "string"
            ? profile.email
            : typeof profile.preferred_username === "string"
              ? profile.preferred_username
              : "";
        const name = typeof profile.name === "string" ? profile.name : email;
        try {
          typed.appUser = await syncSessionUser({
            entraObjectId: oid,
            email,
            displayName: name,
            groupIds: groupsFromProfile(profile),
          });
        } catch (error) {
          logger.error("entra_sync_failed", { error: String(error) });
          typed.appUser = {
            id: oid,
            email,
            name,
            roles: [AppRole.COLLABORATOR],
          };
        }
        return typed;
      }

      // Refresh / cookie antigo: rehidrata se appUser.id sumiu do JWT.
      if (!typed.appUser?.id) {
        try {
          const email =
            typeof typed.email === "string"
              ? typed.email
              : typeof typed.appUser?.email === "string"
                ? typed.appUser.email
                : "";
          const id =
            typeof typed.sub === "string"
              ? typed.sub
              : typeof typed.appUser?.id === "string"
                ? typed.appUser.id
                : "";
          const resolved = await resolveSessionUser({ id, email });
          if (resolved) typed.appUser = resolved;
        } catch (error) {
          logger.error("session_rehydrate_failed", { error: String(error) });
        }
      }

      return typed;
    },
    async session({ session, token }) {
      const typed = token as typeof token & TokenWithUser;
      const appUser = typed.appUser;
      if (appUser?.id) {
        session.user = {
          ...session.user,
          id: appUser.id,
          email: appUser.email,
          name: appUser.name,
          roles: appUser.roles?.length ? appUser.roles : [AppRole.COLLABORATOR],
          contractStatus: appUser.contractStatus ?? null,
          effectiveRole: appUser.effectiveRole,
        };
        return session;
      }

      // Fallback mínimo — evita Prisma com userId undefined.
      const fallbackId = typeof typed.sub === "string" ? typed.sub : "";
      session.user = {
        ...session.user,
        id: fallbackId,
        email: typeof typed.email === "string" ? typed.email : session.user?.email ?? "",
        name:
          typeof typed.name === "string"
            ? typed.name
            : session.user?.name ?? session.user?.email ?? "",
        roles: [AppRole.COLLABORATOR],
      };
      return session;
    },
  },
});
