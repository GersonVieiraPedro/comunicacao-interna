import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AppRole } from "@/types/roles";
import { AppRole as Role, canonicalizeRoles } from "@/types/roles";

export async function findUserByEntraId(entraObjectId: string) {
  return prisma.user.findUnique({
    where: { entraObjectId },
    include: { roles: true },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { roles: true },
  });
}

export async function findUserByCodigoFuncionario(codigo: number) {
  return prisma.user.findUnique({
    where: { codigoFuncionario: codigo },
    include: { roles: true },
  });
}

/** Resolve login por e-mail ou código numérico do funcionário. */
export async function findUserByLogin(login: string) {
  const trimmed = login.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const byCode = await findUserByCodigoFuncionario(Number(trimmed));
    if (byCode) return byCode;
  }
  return findUserByEmail(trimmed.toLowerCase());
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { roles: true },
  });
}

export type ListUsersFilters = {
  q?: string;
  activeOnly?: boolean;
  /** active | inactive — mais específico que activeOnly */
  status?: "all" | "active" | "inactive";
  role?: "all" | Role;
  push?: "all" | "yes" | "no";
  source?: "all" | "erp" | "manual";
  contractType?: "all" | "TEMPORARY" | "THIRD_PARTY" | "none";
  page?: number;
  pageSize?: number;
};

function buildUserListWhere(filters?: ListUsersFilters) {
  const q = filters?.q?.trim();
  const status = filters?.status ?? (filters?.activeOnly ? "active" : "all");
  const role = filters?.role ?? "all";
  const push = filters?.push ?? "all";
  const source = filters?.source ?? "all";
  const contractType = filters?.contractType ?? "all";
  const and: Array<Record<string, unknown>> = [];

  if (status === "active") and.push({ active: true });
  if (status === "inactive") and.push({ active: false });
  if (role !== "all") and.push({ roles: { some: { role } } });
  if (push === "yes") and.push({ pushSubscriptions: { some: { active: true } } });
  if (push === "no") and.push({ pushSubscriptions: { none: { active: true } } });
  if (source === "erp") and.push({ codigoFuncionario: { not: null } });
  if (source === "manual") and.push({ codigoFuncionario: null });
  if (contractType === "TEMPORARY" || contractType === "THIRD_PARTY") {
    and.push({ contractType });
  }
  if (contractType === "none") {
    and.push({ OR: [{ contractType: null }, { contractType: "" }] });
  }
  if (q) {
    and.push({
      OR: [
        { email: { contains: q } },
        { displayName: { contains: q } },
        ...(/^\d+$/.test(q) ? [{ codigoFuncionario: Number(q) }] : []),
      ],
    });
  }

  return and.length ? { AND: and } : {};
}

export async function listUsers(filters?: ListUsersFilters) {
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 25));
  const where = buildUserListWhere(filters);

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        roles: true,
        _count: {
          select: {
            pushSubscriptions: { where: { active: true } },
          },
        },
      },
      orderBy: [{ displayName: "asc" }, { email: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** @deprecated use listUsers — mantido para callers que esperavam array */
export async function listUsersLegacy(filters?: { q?: string; activeOnly?: boolean }) {
  const result = await listUsers({
    q: filters?.q,
    activeOnly: filters?.activeOnly,
    page: 1,
    pageSize: 200,
  });
  return result.items;
}

export async function countActiveUsers() {
  return prisma.user.count({ where: { active: true } });
}

/** Usuários ativos com pelo menos uma subscription de push ativa. */
export async function countUsersWithActivePush() {
  return prisma.user.count({
    where: {
      active: true,
      pushSubscriptions: { some: { active: true } },
    },
  });
}

export async function countActivePushSubscriptions() {
  return prisma.pushSubscription.count({ where: { active: true } });
}

export async function upsertEntraUser(input: {
  entraObjectId: string;
  email: string;
  displayName: string;
  roles: AppRole[];
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  return prisma.user.upsert({
    where: { entraObjectId: input.entraObjectId },
    create: {
      entraObjectId: input.entraObjectId,
      email,
      displayName: input.displayName,
      active: true,
      roles: { create: input.roles.map((role) => ({ role })) },
    },
    update: {
      email,
      displayName: input.displayName,
      roles: {
        deleteMany: {},
        create: input.roles.map((role) => ({ role })),
      },
    },
  });
}

export async function upsertPasswordUser(input: {
  email: string;
  displayName: string;
  passwordHash: string;
  roles: AppRole[];
  subject: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  return prisma.user.upsert({
    where: { email },
    create: {
      entraObjectId: input.subject,
      email,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      active: true,
      roles: { create: input.roles.map((role) => ({ role })) },
    },
    update: {
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      entraObjectId: input.subject,
      roles: {
        deleteMany: {},
        create: input.roles.map((role) => ({ role })),
      },
    },
  });
}

export async function createManagedUser(input: {
  email: string;
  displayName: string;
  passwordHash: string;
  roles: AppRole[];
  subject: string;
}) {
  const email = input.email.trim().toLowerCase();
  return prisma.user.create({
    data: {
      entraObjectId: input.subject,
      email,
      displayName: input.displayName.trim(),
      passwordHash: input.passwordHash,
      active: true,
      roles: { create: input.roles.map((role) => ({ role })) },
    },
    include: { roles: true },
  });
}

export async function updateOwnProfile(
  id: string,
  data: {
    displayName?: string;
    passwordHash?: string;
    mustChangePassword?: boolean;
    passwordUpdatedAt?: Date | null;
  },
) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.displayName !== undefined ? { displayName: data.displayName.trim() } : {}),
      ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
      ...(data.mustChangePassword !== undefined
        ? { mustChangePassword: data.mustChangePassword }
        : {}),
      ...(data.passwordUpdatedAt !== undefined
        ? { passwordUpdatedAt: data.passwordUpdatedAt }
        : {}),
    },
  });
}

export async function resetUserTempPassword(
  id: string,
  passwordHash: string,
) {
  return prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: true,
      passwordUpdatedAt: null,
    },
    include: { roles: true },
  });
}

export function normalizeRoles(roles: AppRole[]): AppRole[] {
  const normalized = canonicalizeRoles(roles);
  const set = new Set<AppRole>(normalized);
  if (!set.has(Role.METARH) && !set.has(Role.CLIENT) && !set.has(Role.CANDIDATE)) {
    set.add(Role.COLLABORATOR);
  }
  if (set.has(Role.METARH)) {
    set.add(Role.COLLABORATOR);
  }
  return [...set];
}

export type HrProfileFields = {
  contractStatus?: string | null;
  contractType?: string | null;
  economicGroup?: string | null;
  cnpj?: string | null;
  healthPlan?: string | null;
  reimbursementCard?: string | null;
  clientOrgId?: string | null;
};

export async function updateManagedUser(
  id: string,
  data: {
    displayName?: string;
    active?: boolean;
    roles?: AppRole[];
    passwordHash?: string;
  } & HrProfileFields,
) {
  return prisma.$transaction(async (tx) => {
    if (data.roles) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: normalizeRoles(data.roles).map((role) => ({ userId: id, role })),
      });
    }
    return tx.user.update({
      where: { id },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName.trim() } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.passwordHash !== undefined
          ? {
              passwordHash: data.passwordHash,
              mustChangePassword: false,
              passwordUpdatedAt: new Date(),
            }
          : {}),
        ...(data.contractStatus !== undefined ? { contractStatus: data.contractStatus } : {}),
        ...(data.contractType !== undefined ? { contractType: data.contractType } : {}),
        ...(data.economicGroup !== undefined ? { economicGroup: data.economicGroup } : {}),
        ...(data.cnpj !== undefined ? { cnpj: data.cnpj } : {}),
        ...(data.healthPlan !== undefined ? { healthPlan: data.healthPlan } : {}),
        ...(data.reimbursementCard !== undefined
          ? { reimbursementCard: data.reimbursementCard }
          : {}),
        ...(data.clientOrgId !== undefined ? { clientOrgId: data.clientOrgId } : {}),
      },
      include: { roles: true },
    });
  });
}

export async function countUsersMatchingAudience(filters: {
  audienceType: string;
  targets: { targetType: string; targetValue: string }[];
}) {
  if (filters.audienceType === "ALL") {
    return prisma.user.count({ where: { active: true } });
  }
  const { buildAudienceWhereFromTargets } = await import("@/domain/audience-matching");
  const targetWhere = buildAudienceWhereFromTargets(
    filters.targets as import("@/types/audience").AudienceTargetInput[],
  );
  return prisma.user.count({
    where: {
      ...targetWhere,
      // Inativos só entram se o filtro de status pedir; caso contrário, ativos
      ...(filters.targets.some((t) => t.targetType === "CONTRACT_STATUS")
        ? {}
        : { active: true }),
    },
  });
}
