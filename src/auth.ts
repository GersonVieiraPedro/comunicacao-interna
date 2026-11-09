import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { logger } from "@/lib/logger";
import {
  authenticatePasswordUser,
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
    const user = await authenticatePasswordUser(email, password);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, roles: user.roles };
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
      }
      return typed;
    },
    async session({ session, token }) {
      const appUser = (token as TokenWithUser).appUser;
      if (appUser) {
        session.user = {
          ...session.user,
          id: appUser.id,
          email: appUser.email,
          name: appUser.name,
          roles: appUser.roles,
        };
      }
      return session;
    },
  },
});
