import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AppRole } from "@/types/roles";

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
