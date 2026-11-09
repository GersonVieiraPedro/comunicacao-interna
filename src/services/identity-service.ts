import { AppRole, isAppRole, type AppRole as Role } from "@/types/roles";
import { communicatorGroupIds, getEnv } from "@/lib/env";
import { LOCAL_DEV_PERSONAS, type LocalDevPersona } from "@/lib/dev-auth";
import { verifyPassword } from "@/lib/password";
import {
  findUserByEmail,
  findUserByEntraId,
  upsertEntraUser,
} from "@/repositories/user-repository";
import type { SessionUser } from "@/lib/authz";

function uniqueRoles(roles: Role[]): Role[] {
  return [...new Set(roles)];
}

export function mapGroupsToRoles(groupIds: string[], communicatorIds: string[]): Role[] {
  const communicators = new Set(communicatorIds);
  const roles: Role[] = [AppRole.COLLABORATOR];
  if (groupIds.some((id) => communicators.has(id))) {
    roles.push(AppRole.COMMUNICATOR);
  }
  return uniqueRoles(roles);
}

export function mapEntraGroupsToRoles(groupIds: string[]): Role[] {
  const env = getEnv();
  return mapGroupsToRoles(groupIds, communicatorGroupIds(env));
}

export async function syncLocalDevUser(persona: LocalDevPersona): Promise<SessionUser> {
  const profile = LOCAL_DEV_PERSONAS[persona];
  const roles: Role[] =
    persona === "communicator"
      ? [AppRole.COLLABORATOR, AppRole.COMMUNICATOR]
      : [AppRole.COLLABORATOR];
  await upsertEntraUser({
    entraObjectId: profile.entraObjectId,
    email: profile.email,
    displayName: profile.displayName,
    roles,
  });
  const stored = await findUserByEntraId(profile.entraObjectId);
  return {
    id: stored?.id ?? profile.entraObjectId,
    email: profile.email,
    name: profile.displayName,
    roles: stored?.roles.map((item) => item.role).filter(isAppRole) ?? roles,
  };
}

export async function syncSessionUser(input: {
  entraObjectId: string;
  email: string;
  displayName: string;
  groupIds: string[];
}): Promise<SessionUser> {
  const roles = mapEntraGroupsToRoles(input.groupIds);
  await upsertEntraUser({ ...input, roles });
  const stored = await findUserByEntraId(input.entraObjectId);
  return {
    id: stored?.id ?? input.entraObjectId,
    email: input.email,
    name: input.displayName,
    roles: stored?.roles.map((item) => item.role).filter(isAppRole) ?? roles,
  };
}

/** Login interno e-mail/senha. Retorna null se inválido (mensagem genérica no Auth.js). */
export async function authenticatePasswordUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return null;
  const stored = await findUserByEmail(normalized);
  if (!stored?.passwordHash || !stored.active) return null;
  const ok = await verifyPassword(password, stored.passwordHash);
  if (!ok) return null;
  return {
    id: stored.id,
    email: stored.email,
    name: stored.displayName,
    roles: stored.roles.map((item) => item.role).filter(isAppRole),
  };
}
