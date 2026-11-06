import { prisma } from "@/lib/db";
import { hashEndpoint } from "@/lib/crypto-hash";

export async function upsertPushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  const endpointHash = hashEndpoint(input.endpoint);
  return prisma.pushSubscription.upsert({
    where: { endpointHash },
    create: {
      userId: input.userId,
      endpoint: input.endpoint,
      endpointHash,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent,
      active: true,
    },
    update: {
      userId: input.userId,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent,
      active: true,
      updatedAt: new Date(),
    },
  });
}

export async function deactivateByEndpoint(endpoint: string) {
  return prisma.pushSubscription.updateMany({
    where: { endpointHash: hashEndpoint(endpoint) },
    data: { active: false },
  });
}

export async function listActiveSubscriptions() {
  return prisma.pushSubscription.findMany({ where: { active: true } });
}

export async function markUsed(id: string) {
  return prisma.pushSubscription.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}

export async function deactivate(id: string) {
  return prisma.pushSubscription.update({
    where: { id },
    data: { active: false },
  });
}
