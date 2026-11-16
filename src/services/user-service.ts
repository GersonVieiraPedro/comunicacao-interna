import type { SessionUser } from "@/lib/authz";
import { requireMetarh, requireUser } from "@/lib/authz";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { credentialsSubject, hashPassword, verifyPassword } from "@/lib/password";
import {
  AppRole,
  canonicalizeRoles,
  isAppRole,
  resolveEffectiveRole,
  type AppRole as Role,
} from "@/types/roles";
import {
  createManagedUser,
  findUserByEmail,
  findUserById,
  listUsers,
  normalizeRoles,
  updateManagedUser,
  updateOwnProfile,
} from "@/repositories/user-repository";
import {
  createUserSchema,
  updateProfileSchema,
  updateUserSchema,
} from "@/validations/user";

function toSessionShape(user: {
  id: string;
  email: string;
  displayName: string;
  contractStatus?: string | null;
  roles: Array<{ role: string }>;
}): SessionUser {
  const roles = canonicalizeRoles(user.roles.map((item) => item.role).filter(isAppRole));
  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    roles,
    contractStatus: user.contractStatus ?? null,
    effectiveRole: resolveEffectiveRole({
      roles,
      contractStatus: user.contractStatus,
    }),
  };
}

function parseRoles(raw: unknown): Role[] {
  if (!Array.isArray(raw)) return [AppRole.COLLABORATOR];
  const roles = raw.filter((item): item is Role => typeof item === "string" && isAppRole(item));
  return normalizeRoles(roles.length ? roles : [AppRole.COLLABORATOR]);
}

export async function listManagedUsers(user: SessionUser | undefined, q?: string) {
  requireMetarh(user);
  return listUsers({ q });
}

export async function createUser(user: SessionUser | undefined, raw: unknown) {
  requireMetarh(user);
  const parsed = createUserSchema.parse({
    ...(raw as object),
    roles: parseRoles((raw as { roles?: unknown })?.roles),
  });
  const email = parsed.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) throw new ValidationError("Já existe um usuário com este e-mail.");
  const passwordHash = await hashPassword(parsed.password);
  const created = await createManagedUser({
    email,
    displayName: parsed.displayName,
    passwordHash,
    roles: normalizeRoles(parsed.roles),
    subject: credentialsSubject(email),
  });
  await updateManagedUser(created.id, {
    contractStatus: parsed.contractStatus ?? "ACTIVE",
    contractType: parsed.contractType ?? null,
    economicGroup: parsed.economicGroup ?? null,
    cnpj: parsed.cnpj ?? null,
    healthPlan: parsed.healthPlan ?? null,
    reimbursementCard: parsed.reimbursementCard ?? null,
    clientOrgId: parsed.clientOrgId ?? null,
  });
  const refreshed = await findUserById(created.id);
  return toSessionShape(refreshed ?? created);
}

export async function updateUser(user: SessionUser | undefined, raw: unknown) {
  const actor = requireMetarh(user);
  const parsed = updateUserSchema.parse({
    ...(raw as object),
    roles: (raw as { roles?: unknown }).roles
      ? parseRoles((raw as { roles?: unknown }).roles)
      : undefined,
  });
  const existing = await findUserById(parsed.id);
  if (!existing) throw new NotFoundError("Usuário não encontrado.");
  if (parsed.active === false && existing.id === actor.id) {
    throw new ValidationError("Você não pode desativar a própria conta.");
  }
  const passwordHash = parsed.password ? await hashPassword(parsed.password) : undefined;
  const updated = await updateManagedUser(parsed.id, {
    displayName: parsed.displayName,
    active: parsed.active,
    roles: parsed.roles ? normalizeRoles(parsed.roles) : undefined,
    passwordHash,
    contractStatus: parsed.contractStatus,
    contractType: parsed.contractType,
    economicGroup: parsed.economicGroup,
    cnpj: parsed.cnpj,
    healthPlan: parsed.healthPlan,
    reimbursementCard: parsed.reimbursementCard,
    clientOrgId: parsed.clientOrgId,
  });
  return toSessionShape(updated);
}

export async function updateProfile(user: SessionUser | undefined, raw: unknown) {
  const actor = requireUser(user);
  const parsed = updateProfileSchema.parse(raw);
  const stored = await findUserById(actor.id);
  if (!stored) throw new NotFoundError("Usuário não encontrado.");
  if (!stored.active) throw new ValidationError("Conta desativada.");

  let passwordHash: string | undefined;
  if (parsed.newPassword) {
    if (!stored.passwordHash) {
      throw new ValidationError("Esta conta não usa senha local.");
    }
    const ok = await verifyPassword(parsed.currentPassword ?? "", stored.passwordHash);
    if (!ok) throw new ValidationError("Senha atual incorreta.");
    passwordHash = await hashPassword(parsed.newPassword);
  }

  await updateOwnProfile(actor.id, {
    displayName: parsed.displayName,
    passwordHash,
  });
  const refreshed = await findUserById(actor.id);
  if (!refreshed) throw new NotFoundError("Usuário não encontrado.");
  return toSessionShape(refreshed);
}

export async function getProfile(user: SessionUser | undefined) {
  const actor = requireUser(user);
  const stored = await findUserById(actor.id);
  if (!stored) throw new NotFoundError("Usuário não encontrado.");
  return {
    id: stored.id,
    email: stored.email,
    displayName: stored.displayName,
    active: stored.active,
    hasPassword: Boolean(stored.passwordHash),
    roles: canonicalizeRoles(stored.roles.map((item) => item.role).filter(isAppRole)),
    contractStatus: stored.contractStatus,
    contractType: stored.contractType,
    economicGroup: stored.economicGroup,
    cnpj: stored.cnpj,
    effectiveRole: resolveEffectiveRole({
      roles: canonicalizeRoles(stored.roles.map((item) => item.role).filter(isAppRole)),
      contractStatus: stored.contractStatus,
    }),
  };
}
