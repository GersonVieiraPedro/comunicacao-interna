import { prisma } from "@/lib/db";
import { DeliveryJobStatus, DeliveryJobType } from "@/types/communication";
import type { Prisma } from "@prisma/client";

export async function enqueueFanoutJob(communicationId: string) {
  const existing = await prisma.deliveryJob.findFirst({
    where: {
      communicationId,
      type: DeliveryJobType.FANOUT_PUBLICATION,
      status: { in: [DeliveryJobStatus.PENDING, DeliveryJobStatus.PROCESSING] },
    },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.deliveryJob.create({
    data: {
      type: DeliveryJobType.FANOUT_PUBLICATION,
      communicationId,
      status: DeliveryJobStatus.PENDING,
      cursor: JSON.stringify({ phase: "in_app", offset: 0 }),
      availableAt: new Date(),
    },
  });
}

export async function claimNextDeliveryJob(now = new Date()) {
  const staleBefore = new Date(now.getTime() - 2 * 60_000);
  const candidate = await prisma.deliveryJob.findFirst({
    where: {
      availableAt: { lte: now },
      OR: [
        { status: DeliveryJobStatus.PENDING },
        { status: DeliveryJobStatus.PROCESSING, startedAt: { lte: staleBefore } },
      ],
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
  });
  if (!candidate) return null;

  const updated = await prisma.deliveryJob.updateMany({
    where: {
      id: candidate.id,
      status: candidate.status,
      attempts: candidate.attempts,
    },
    data: {
      status: DeliveryJobStatus.PROCESSING,
      startedAt: candidate.startedAt ?? now,
      attempts: { increment: 1 },
      availableAt: new Date(now.getTime() + 60_000),
      lastError: null,
    },
  });
  if (updated.count === 0) return null;
  return prisma.deliveryJob.findUnique({ where: { id: candidate.id } });
}

export async function saveDeliveryJobProgress(
  id: string,
  data: { cursor: string | null; status?: string; lastError?: string | null; completedAt?: Date | null },
) {
  return prisma.deliveryJob.update({
    where: { id },
    data: {
      cursor: data.cursor,
      ...(data.status ? { status: data.status } : {}),
      ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
      ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
      availableAt: new Date(),
    },
  });
}

export async function failDeliveryJob(id: string, error: string, retryAt: Date | null) {
  if (retryAt) {
    return prisma.deliveryJob.update({
      where: { id },
      data: {
        status: DeliveryJobStatus.PENDING,
        lastError: error.slice(0, 500),
        availableAt: retryAt,
        startedAt: null,
      },
    });
  }
  return prisma.deliveryJob.update({
    where: { id },
    data: {
      status: DeliveryJobStatus.FAILED,
      lastError: error.slice(0, 500),
      completedAt: new Date(),
    },
  });
}

export async function countPendingDeliveryJobs() {
  return prisma.deliveryJob.count({
    where: { status: { in: [DeliveryJobStatus.PENDING, DeliveryJobStatus.PROCESSING] } },
  });
}

async function audienceWhereForCommunication(
  communicationId: string,
): Promise<Prisma.UserWhereInput> {
  const communication = await prisma.communication.findUnique({
    where: { id: communicationId },
    include: { targets: true },
  });
  if (!communication || communication.audienceType !== "FILTERED") {
    return {
      active: true,
      notifications: { none: { communicationId } },
    };
  }

  const { buildAudienceWhereFromTargets } = await import("@/domain/audience-matching");
  const targetWhere = buildAudienceWhereFromTargets(communication.targets);
  const hasStatusFilter = communication.targets.some((t) => t.targetType === "CONTRACT_STATUS");
  return {
    ...(targetWhere as Prisma.UserWhereInput),
    ...(hasStatusFilter ? {} : { active: true }),
    notifications: { none: { communicationId } },
  };
}

export async function listUserIdsMissingNotification(communicationId: string, take: number) {
  const where = await audienceWhereForCommunication(communicationId);
  const users = await prisma.user.findMany({
    where,
    select: { id: true },
    orderBy: { id: "asc" },
    take,
  });
  return users.map((user) => user.id);
}

export async function countUsersMissingNotification(communicationId: string) {
  const where = await audienceWhereForCommunication(communicationId);
  return prisma.user.count({ where });
}
