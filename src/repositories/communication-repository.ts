import { prisma } from "@/lib/db";
import { CommunicationStatus } from "@/types/communication";
import type { CommunicationPriority } from "@/types/communication";

export async function countEligibleCollaborators() {
  return prisma.user.count();
}

export async function listCollaboratorUserIds() {
  const users = await prisma.user.findMany({ select: { id: true } });
  return users.map((user) => user.id);
}

export async function findCategoryById(id: string) {
  return prisma.communicationCategory.findUnique({ where: { id } });
}

export async function listCategories() {
  return prisma.communicationCategory.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createCommunication(data: {
  title: string;
  subtitle?: string | null;
  summary: string;
  bodyHtml: string;
  coverPath?: string | null;
  categoryId: string;
  authorUserId: string;
  status: string;
  priority: string;
  scheduledPublishAt?: Date | null;
  expiresAt?: Date | null;
}) {
  return prisma.communication.create({ data });
}

export async function updateCommunication(id: string, data: Record<string, unknown>) {
  return prisma.communication.update({ where: { id }, data });
}

export async function findCommunicationById(id: string) {
  return prisma.communication.findUnique({
    where: { id },
    include: { category: true, author: true, publishedBy: true },
  });
}

export async function listPublishedForFeed(now: Date, take: number, userId: string) {
  return prisma.communication.findMany({
    where: {
      status: CommunicationStatus.PUBLISHED,
      audienceType: "ALL",
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { category: true, reads: { where: { userId } } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function listDueScheduled(now: Date) {
  return prisma.communication.findMany({
    where: {
      status: CommunicationStatus.SCHEDULED,
      scheduledPublishAt: { lte: now },
    },
  });
}

export async function listDueExpired(now: Date) {
  return prisma.communication.findMany({
    where: {
      status: CommunicationStatus.PUBLISHED,
      expiresAt: { lte: now },
    },
  });
}

export type HistoryFilters = {
  q?: string;
  categoryId?: string;
  from?: Date;
  to?: Date;
  unreadOnly?: boolean;
  userId: string;
  page: number;
  pageSize: number;
  now: Date;
};

export async function searchHistory(filters: HistoryFilters) {
  const { page, pageSize, userId, now } = filters;
  const unreadFilter = filters.unreadOnly
    ? { reads: { none: { userId } } }
    : {};

  const where = {
    status: { in: [CommunicationStatus.PUBLISHED, CommunicationStatus.EXPIRED] },
    audienceType: "ALL",
    publishedAt: {
      lte: now,
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    },
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q } },
            { summary: { contains: filters.q } },
            { bodyHtml: { contains: filters.q } },
          ],
        }
      : {}),
    ...unreadFilter,
  };

  const [total, items] = await prisma.$transaction([
    prisma.communication.count({ where }),
    prisma.communication.findMany({
      where,
      include: { category: true, reads: { where: { userId } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { total, items };
}

export async function listScheduledAgenda(now = new Date()) {
  return prisma.communication.findMany({
    where: {
      status: CommunicationStatus.SCHEDULED,
      scheduledPublishAt: { not: null },
    },
    include: { category: true, author: true },
    orderBy: { scheduledPublishAt: "asc" },
    take: 100,
  }).then((items) =>
    items.map((item) => ({
      ...item,
      isDue: Boolean(item.scheduledPublishAt && item.scheduledPublishAt <= now),
    })),
  );
}

export async function listAdmin(filters: {
  status?: string;
  categoryId?: string;
  priority?: CommunicationPriority;
  authorUserId?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}) {
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.authorUserId ? { authorUserId: filters.authorUserId } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.communication.count({ where }),
    prisma.communication.findMany({
      where,
      include: { category: true, author: true, _count: { select: { reads: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { total, items };
}

export async function countByStatus() {
  const groups = await prisma.communication.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((row) => [row.status, row._count._all]));
}

export async function readCountsByCommunication(ids: string[]) {
  if (ids.length === 0) return new Map<string, number>();
  const groups = await prisma.communicationRead.groupBy({
    by: ["communicationId"],
    where: { communicationId: { in: ids } },
    _count: { _all: true },
  });
  return new Map(groups.map((row) => [row.communicationId, row._count._all]));
}

export async function lowestReadRate(eligibleCount: number, take = 5) {
  const published = await prisma.communication.findMany({
    where: { status: CommunicationStatus.PUBLISHED },
    include: { _count: { select: { reads: true } } },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  return published
    .map((item) => ({
      id: item.id,
      title: item.title,
      readCount: item._count.reads,
      percent: eligibleCount === 0 ? 0 : Math.round((item._count.reads / eligibleCount) * 100),
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, take);
}

export async function upsertRead(userId: string, communicationId: string, at: Date) {
  return prisma.communicationRead.upsert({
    where: { userId_communicationId: { userId, communicationId } },
    create: { userId, communicationId, firstViewedAt: at, lastViewedAt: at, viewCount: 1 },
    update: { lastViewedAt: at, viewCount: { increment: 1 } },
  });
}

export async function countReads(communicationId: string) {
  return prisma.communicationRead.count({ where: { communicationId } });
}

export async function findRead(userId: string, communicationId: string) {
  return prisma.communicationRead.findUnique({
    where: { userId_communicationId: { userId, communicationId } },
  });
}

export async function listUnreadEligible(userId: string, now: Date) {
  return prisma.communication.findMany({
    where: {
      status: CommunicationStatus.PUBLISHED,
      audienceType: "ALL",
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      reads: { none: { userId } },
    },
    include: { category: true },
  });
}

export async function createAudit(data: {
  action: string;
  actorUserId?: string | null;
  communicationId?: string | null;
  metadata?: string | null;
}) {
  return prisma.auditEvent.create({ data });
}
