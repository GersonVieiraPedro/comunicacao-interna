import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AppRole } from "@/types/roles";

export async function findUserByEntraId(entraObjectId: string) {
  return prisma.user.findUnique({
    where: { entraObjectId },
    include: { roles: true },
  });
}

export async function upsertEntraUser(input: {
  entraObjectId: string;
  email: string;
  displayName: string;
  roles: AppRole[];
}): Promise<User> {
  return prisma.user.upsert({
    where: { entraObjectId: input.entraObjectId },
    create: {
      entraObjectId: input.entraObjectId,
      email: input.email,
      displayName: input.displayName,
      roles: { create: input.roles.map((role) => ({ role })) },
    },
    update: {
      email: input.email,
      displayName: input.displayName,
      roles: {
        deleteMany: {},
        create: input.roles.map((role) => ({ role })),
      },
    },
  });
}
