import { prisma } from "@/lib/db";

export async function createNotificationsForUsers(input: {
  userIds: string[];
  communicationId: string;
  title: string;
  body: string;
}) {
  if (input.userIds.length === 0) return;
  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      communicationId: input.communicationId,
      title: input.title,
      body: input.body,
    })),
  });
}

export async function listNotifications(userId: string, take = 30) {
  return prisma.notification.findMany({
    where: { userId },
    include: { communication: { select: { id: true, title: true, priority: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markNotificationsForCommunication(userId: string, communicationId: string) {
  return prisma.notification.updateMany({
    where: { userId, communicationId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function logDelivery(data: {
  communicationId: string;
  userId?: string | null;
  channel: string;
  status: string;
  errorCode?: string | null;
}) {
  return prisma.notificationDelivery.create({ data });
}
