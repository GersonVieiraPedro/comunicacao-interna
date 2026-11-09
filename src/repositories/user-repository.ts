import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AppRole } from "@/types/roles";
import { AppRole as Role } from "@/types/roles";

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

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { roles: true },
  });
}

export async function listUsers(filters?: { q?: string; activeOnly?: boolean }) {
  const q = filters?.q?.trim();
  return prisma.user.findMany({
    where: {
      ...(filters?.activeOnly ? { active: true } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { displayName: { contains: q } },
            ],
          }
        : {}),
    },
    include: { roles: true },
    orderBy: { displayName: "asc" },
    take: 200,
  });
}

export async function countActiveUsers() {
  return prisma.user.count({ where: { active: true } });
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

export async function updateManagedUser(
  id: string,
  data: {
    displayName?: string;
    active?: boolean;
    roles?: AppRole[];
    passwordHash?: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.roles) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: data.roles.map((role) => ({ userId: id, role })),
      });
    }
    return tx.user.update({
      where: { id },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName.trim() } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
      },
      include: { roles: true },
    });
  });
}

export async function updateOwnProfile(
  id: string,
  data: { displayName?: string; passwordHash?: string },
) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.displayName !== undefined ? { displayName: data.displayName.trim() } : {}),
      ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
    },
  });
}

export function normalizeRoles(roles: AppRole[]): AppRole[] {
  const set = new Set<AppRole>(roles);
  set.add(Role.COLLABORATOR);
  if (roles.includes(Role.COMMUNICATOR)) set.add(Role.COMMUNICATOR);
  return [...set];
}
