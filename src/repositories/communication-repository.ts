import { prisma } from "@/lib/db";
import { CommunicationStatus } from "@/types/communication";
import type { CommunicationPriority } from "@/types/communication";

export async function countEligibleCollaborators() {
  return prisma.user.count({ where: { active: true } });
}

export async function listCollaboratorUserIds() {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true },
  });
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
    ? {
        NOT: {
          reads: {
            some: {
              userId,
              acknowledgedAt: { not: null },
            },
          },
        },
      }
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

/** Publicações por dia (últimos N dias, fuso Brasília). */
export async function publicationsByDay(days = 14) {
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const items = await prisma.communication.findMany({
    where: {
      publishedAt: { gte: from, lte: now },
      status: {
        in: [CommunicationStatus.PUBLISHED, CommunicationStatus.EXPIRED],
      },
    },
    select: { publishedAt: true },
  });

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const labelFmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  });

  const buckets = new Map<string, { date: string; label: string; count: number }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = fmt.format(d);
    buckets.set(key, { date: key, label: labelFmt.format(d), count: 0 });
  }
  for (const item of items) {
    if (!item.publishedAt) continue;
    const key = fmt.format(item.publishedAt);
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }
  return [...buckets.values()];
}

/** Funil agregado dos publicados vigentes. */
export async function aggregateEngagementFunnel(eligibleCount: number) {
  const published = await prisma.communication.findMany({
    where: { status: CommunicationStatus.PUBLISHED },
    select: { id: true },
  });
  const ids = published.map((item) => item.id);
  if (ids.length === 0) {
    return {
      publishedCount: 0,
      eligibleCount,
      delivered: 0,
      viewed: 0,
      opened: 0,
      acknowledged: 0,
    };
  }

  const [delivered, viewed, opened, acknowledged] = await Promise.all([
    prisma.notification.count({ where: { communicationId: { in: ids } } }),
    prisma.communicationRead.count({ where: { communicationId: { in: ids } } }),
    prisma.notification.count({
      where: { communicationId: { in: ids }, openedAt: { not: null } },
    }),
    prisma.communicationRead.count({
      where: { communicationId: { in: ids }, acknowledgedAt: { not: null } },
    }),
  ]);

  return {
    publishedCount: ids.length,
    eligibleCount,
    delivered,
    viewed,
    opened,
    acknowledged,
  };
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
    include: {
      _count: {
        select: {
          reads: true,
          notifications: true,
        },
      },
      reads: {
        where: { acknowledgedAt: { not: null } },
        select: { id: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  return published
    .map((item) => {
      const ackCount = item.reads.length;
      const viewCount = item._count.reads;
      return {
        id: item.id,
        title: item.title,
        readCount: ackCount,
        viewCount,
        deliveredCount: item._count.notifications,
        percent: eligibleCount === 0 ? 0 : Math.round((ackCount / eligibleCount) * 100),
        percentViewed: eligibleCount === 0 ? 0 : Math.round((viewCount / eligibleCount) * 100),
      };
    })
    .sort((a, b) => a.percent - b.percent)
    .slice(0, take);
}

/** Registra visualização automática (abertura). Não confirma ciência. */
export async function upsertView(userId: string, communicationId: string, at: Date) {
  return prisma.communicationRead.upsert({
    where: { userId_communicationId: { userId, communicationId } },
    create: {
      userId,
      communicationId,
      firstViewedAt: at,
      lastViewedAt: at,
      viewCount: 1,
      acknowledgedAt: null,
    },
    update: { lastViewedAt: at, viewCount: { increment: 1 } },
  });
}

/** Confirmação explícita de leitura/ciência. */
export async function upsertAcknowledge(userId: string, communicationId: string, at: Date) {
  return prisma.communicationRead.upsert({
    where: { userId_communicationId: { userId, communicationId } },
    create: {
      userId,
      communicationId,
      firstViewedAt: at,
      lastViewedAt: at,
      viewCount: 1,
      acknowledgedAt: at,
    },
    update: {
      lastViewedAt: at,
      acknowledgedAt: at,
      viewCount: { increment: 1 },
    },
  });
}

/** @deprecated use upsertView / upsertAcknowledge */
export async function upsertRead(userId: string, communicationId: string, at: Date) {
  return upsertAcknowledge(userId, communicationId, at);
}

export async function countReads(communicationId: string) {
  return prisma.communicationRead.count({ where: { communicationId } });
}

export async function countViews(communicationId: string) {
  return prisma.communicationRead.count({ where: { communicationId } });
}

export async function countAcknowledged(communicationId: string) {
  return prisma.communicationRead.count({
    where: { communicationId, acknowledgedAt: { not: null } },
  });
}

export async function findRead(userId: string, communicationId: string) {
  return prisma.communicationRead.findUnique({
    where: { userId_communicationId: { userId, communicationId } },
  });
}

/** Pendentes de confirmação explícita (ainda não deram "ciência"). */
export async function listUnreadEligible(userId: string, now: Date) {
  return prisma.communication.findMany({
    where: {
      status: CommunicationStatus.PUBLISHED,
      audienceType: "ALL",
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      NOT: {
        reads: {
          some: {
            userId,
            acknowledgedAt: { not: null },
          },
        },
      },
    },
    include: { category: true },
  });
}

export async function listReaders(communicationId: string) {
  return prisma.communicationRead.findMany({
    where: { communicationId },
    include: {
      user: { select: { id: true, displayName: true, email: true, active: true } },
    },
    orderBy: { firstViewedAt: "desc" },
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
