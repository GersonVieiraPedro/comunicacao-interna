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
import { prisma } from "@/lib/db";
import { tempPasswordForCodigo } from "@/lib/temp-password";
import {
  createManagedUser,
  findUserByEmail,
  findUserById,
  listUsers,
  normalizeRoles,
  resetUserTempPassword,
  updateManagedUser,
  updateOwnProfile,
} from "@/repositories/user-repository";
import {
  changePasswordSchema,
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

export async function listManagedUsers(
  user: SessionUser | undefined,
  filters?: {
    q?: string;
    page?: number;
    pageSize?: number;
    status?: "all" | "active" | "inactive";
    role?: "all" | Role;
    push?: "all" | "yes" | "no";
    source?: "all" | "erp" | "manual";
    contractType?: "all" | "TEMPORARY" | "THIRD_PARTY" | "none";
  },
) {
  requireMetarh(user);
  const result = await listUsers({
    q: filters?.q,
    page: filters?.page,
    pageSize: filters?.pageSize,
    status: filters?.status,
    role: filters?.role,
    push: filters?.push,
    source: filters?.source,
    contractType: filters?.contractType,
  });

  const [pushEnabledCount, activeCount] = await Promise.all([
    prisma.user.count({
      where: {
        active: true,
        pushSubscriptions: { some: { active: true } },
      },
    }),
    prisma.user.count({ where: { active: true } }),
  ]);

  return {
    ...result,
    pushEnabledCount,
    activeCount,
  };
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
    ...(passwordHash
      ? { mustChangePassword: false, passwordUpdatedAt: new Date() }
      : {}),
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
    mustChangePassword: stored.mustChangePassword,
    codigoFuncionario: stored.codigoFuncionario,
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

export async function changeOwnPassword(user: SessionUser | undefined, raw: unknown) {
  const actor = requireUser(user);
  const parsed = changePasswordSchema.parse(raw);
  const stored = await findUserById(actor.id);
  if (!stored) throw new NotFoundError("Usuário não encontrado.");
  if (!stored.active) throw new ValidationError("Conta desativada.");
  if (!stored.passwordHash) throw new ValidationError("Esta conta não usa senha local.");

  const ok = await verifyPassword(parsed.currentPassword, stored.passwordHash);
  if (!ok) throw new ValidationError("Senha atual incorreta.");

  if (stored.codigoFuncionario != null) {
    const temp = tempPasswordForCodigo(stored.codigoFuncionario);
    if (parsed.newPassword === temp) {
      throw new ValidationError("Escolha uma senha diferente da temporária.");
    }
  }

  const passwordHash = await hashPassword(parsed.newPassword);
  await updateOwnProfile(actor.id, {
    passwordHash,
    mustChangePassword: false,
    passwordUpdatedAt: new Date(),
  });

  await prisma.auditEvent.create({
    data: {
      action: "PASSWORD_CHANGED",
      actorUserId: actor.id,
      metadata: JSON.stringify({ self: true }),
    },
  });

  return { ok: true as const };
}

/** Reset admin: volta à senha temp METARH#{codigo} (ou e-mail sintético se sem código). */
export async function resetUserPassword(actor: SessionUser | undefined, userId: string) {
  const admin = requireMetarh(actor);
  const stored = await findUserById(userId);
  if (!stored) throw new NotFoundError("Usuário não encontrado.");

  const plain =
    stored.codigoFuncionario != null
      ? tempPasswordForCodigo(stored.codigoFuncionario)
      : `METARH#${stored.email.split("@")[0] ?? "temp"}`;
  const passwordHash = await hashPassword(plain);
  await resetUserTempPassword(stored.id, passwordHash);

  await prisma.auditEvent.create({
    data: {
      action: "PASSWORD_RESET",
      actorUserId: admin.id,
      metadata: JSON.stringify({
        targetUserId: stored.id,
        codigoFuncionario: stored.codigoFuncionario,
      }),
    },
  });

  return {
    ok: true as const,
    tempPasswordHint:
      stored.codigoFuncionario != null
        ? `METARH#${stored.codigoFuncionario}`
        : "Padrão temporário aplicado (sem código ERP).",
  };
}
