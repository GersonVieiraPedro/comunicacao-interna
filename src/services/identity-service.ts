import {
  AppRole,
  canonicalizeRoles,
  isAppRole,
  resolveEffectiveRole,
  type AppRole as Role,
} from "@/types/roles";
import { communicatorGroupIds, getEnv } from "@/lib/env";
import { LOCAL_DEV_PERSONAS, type LocalDevPersona } from "@/lib/dev-auth";
import { verifyPassword } from "@/lib/password";
import {
  findUserByEmail,
  findUserByEntraId,
  findUserById,
  findUserByLogin,
  upsertEntraUser,
} from "@/repositories/user-repository";
import type { SessionUser } from "@/lib/authz";

function uniqueRoles(roles: Role[]): Role[] {
  return canonicalizeRoles(roles);
}

export function mapGroupsToRoles(groupIds: string[], communicatorIds: string[]): Role[] {
  const communicators = new Set(communicatorIds);
  const roles: Role[] = [AppRole.COLLABORATOR];
  if (groupIds.some((id) => communicators.has(id))) {
    roles.push(AppRole.METARH);
  }
  return uniqueRoles(roles);
}

export function mapEntraGroupsToRoles(groupIds: string[]): Role[] {
  const env = getEnv();
  return mapGroupsToRoles(groupIds, communicatorGroupIds(env));
}

function toSessionUser(stored: {
  id: string;
  email: string;
  displayName: string;
  active: boolean;
  contractStatus?: string | null;
  mustChangePassword?: boolean;
  codigoFuncionario?: number | null;
  roles: Array<{ role: string }>;
}): SessionUser | null {
  if (!stored.active) return null;
  const roles = canonicalizeRoles(stored.roles.map((item) => item.role).filter(isAppRole));
  const effectiveRole = resolveEffectiveRole({
    roles,
    contractStatus: stored.contractStatus,
  });
  return {
    id: stored.id,
    email: stored.email,
    name: stored.displayName,
    roles,
    contractStatus: stored.contractStatus ?? null,
    effectiveRole,
    mustChangePassword: Boolean(stored.mustChangePassword),
    codigoFuncionario: stored.codigoFuncionario ?? null,
  };
}

export async function syncLocalDevUser(persona: LocalDevPersona): Promise<SessionUser> {
  const profile = LOCAL_DEV_PERSONAS[persona];
  const roles: Role[] =
    persona === "communicator"
      ? [AppRole.COLLABORATOR, AppRole.METARH]
      : [AppRole.COLLABORATOR];
  await upsertEntraUser({
    entraObjectId: profile.entraObjectId,
    email: profile.email,
    displayName: profile.displayName,
    roles,
  });
  const stored = await findUserByEntraId(profile.entraObjectId);
  if (!stored) {
    return {
      id: profile.entraObjectId,
      email: profile.email,
      name: profile.displayName,
      roles,
      contractStatus: "ACTIVE",
      effectiveRole: resolveEffectiveRole({ roles, contractStatus: "ACTIVE" }),
      mustChangePassword: false,
    };
  }
  return toSessionUser(stored)!;
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
  if (!stored) {
    return {
      id: input.entraObjectId,
      email: input.email,
      name: input.displayName,
      roles,
      effectiveRole: resolveEffectiveRole({ roles, contractStatus: "ACTIVE" }),
      mustChangePassword: false,
    };
  }
  return toSessionUser(stored)!;
}

/** Rehidrata sessão JWT incompleta (sem appUser.id). */
export async function resolveSessionUser(input: {
  id?: string | null;
  email?: string | null;
}): Promise<SessionUser | null> {
  const email = input.email?.trim().toLowerCase();
  if (email) {
    const byEmail = await findUserByEmail(email);
    if (byEmail) return toSessionUser(byEmail);
  }
  const id = input.id?.trim();
  if (id) {
    const byId = await findUserById(id);
    if (byId) return toSessionUser(byId);
    const byEntra = await findUserByEntraId(id);
    if (byEntra) return toSessionUser(byEntra);
  }
  return null;
}

/** Login interno: e-mail ou código do funcionário + senha. */
export async function authenticatePasswordUser(
  login: string,
  password: string,
): Promise<SessionUser | null> {
  const normalized = login.trim();
  if (!normalized || !password) return null;
  const stored = await findUserByLogin(normalized);
  if (!stored?.passwordHash || !stored.active) return null;
  const ok = await verifyPassword(password, stored.passwordHash);
  if (!ok) return null;
  return toSessionUser(stored);
}
