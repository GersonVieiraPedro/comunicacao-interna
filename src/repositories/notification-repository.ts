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
  const now = new Date();
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: now, openedAt: now },
  });
}

export async function markNotificationsForCommunication(userId: string, communicationId: string) {
  const now = new Date();
  return prisma.notification.updateMany({
    where: { userId, communicationId },
    data: {
      readAt: now,
      openedAt: now,
    },
  });
}

export async function markNotificationOpenedByCommunication(userId: string, communicationId: string) {
  const now = new Date();
  return prisma.notification.updateMany({
    where: { userId, communicationId, openedAt: null },
    data: { openedAt: now, readAt: now },
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

export async function logDeliveriesMany(
  rows: Array<{
    communicationId: string;
    userId: string;
    channel: string;
    status: string;
    errorCode?: string | null;
  }>,
) {
  if (rows.length === 0) return;
  await prisma.notificationDelivery.createMany({ data: rows });
}

export async function countDeliveries(communicationId: string) {
  const groups = await prisma.notificationDelivery.groupBy({
    by: ["channel", "status"],
    where: { communicationId },
    _count: { _all: true },
  });
  return groups.map((row) => ({
    channel: row.channel,
    status: row.status,
    count: row._count._all,
  }));
}

export async function countOpenedNotifications(communicationId: string) {
  return prisma.notification.count({
    where: { communicationId, openedAt: { not: null } },
  });
}

export async function countInAppNotifications(communicationId: string) {
  return prisma.notification.count({ where: { communicationId } });
}
