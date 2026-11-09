import type { SessionUser } from "@/lib/authz";
import { requireCommunicator, requireUser } from "@/lib/authz";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { sanitizeCommunicationHtml } from "@/lib/sanitize-html";
import {
  computeObservabilityMetrics,
  computeReadMetrics,
  defaultPushCopy,
  isVisibleToCollaborator,
  selectUnreadPopup,
} from "@/domain/communication-rules";
import { assertFutureDate } from "@/lib/datetime";
import { CommunicationStatus } from "@/types/communication";
import { communicationInputSchema } from "@/validations/communication";
import {
  aggregateEngagementFunnel,
  countAcknowledged,
  countByStatus,
  countEligibleCollaborators,
  countViews,
  createAudit,
  createCommunication,
  findCategoryById,
  findCommunicationById,
  findRead,
  listAdmin,
  listCategories,
  listCollaboratorUserIds,
  listDueExpired,
  listDueScheduled,
  listPublishedForFeed,
  listReaders,
  listScheduledAgenda,
  listUnreadEligible,
  lowestReadRate,
  publicationsByDay,
  searchHistory,
  updateCommunication,
  upsertAcknowledge,
  upsertView,
} from "@/repositories/communication-repository";
import {
  countDeliveries,
  countInAppNotifications,
  countOpenedNotifications,
  createNotificationsForUsers,
  logDeliveriesMany,
  logDelivery,
  markNotificationOpenedByCommunication,
  markNotificationsForCommunication,
} from "@/repositories/notification-repository";
import { countActiveUsers } from "@/repositories/user-repository";
import { DeliveryStatus, NotificationChannel } from "@/types/communication";
import { sendWebPushForPublication } from "@/services/push-service";

async function fanOutPublication(
  communicationId: string,
  options: { sendPush?: boolean } = {},
) {
  const sendPush = options.sendPush ?? true;
  const communication = await findCommunicationById(communicationId);
  const fallback = defaultPushCopy();
  const title = communication?.title?.slice(0, 120) || fallback.title;
  const body = communication?.summary?.slice(0, 200) || fallback.body;
  const userIds = await listCollaboratorUserIds();
  await createNotificationsForUsers({
    userIds,
    communicationId,
    title,
    body,
  });
  await logDeliveriesMany(
    userIds.map((userId) => ({
      communicationId,
      userId,
      channel: NotificationChannel.IN_APP,
      status: DeliveryStatus.SENT,
    })),
  );
  if (!sendPush) return;
  try {
    await sendWebPushForPublication(communicationId);
  } catch (error) {
    await logDelivery({
      communicationId,
      channel: NotificationChannel.WEB_PUSH,
      status: DeliveryStatus.FAILED,
      errorCode: error instanceof Error ? error.message.slice(0, 180) : "FANOUT_PUSH_ERROR",
    });
    // Não falha a publicação se o push cair — o comunicado já está público.
  }
}

async function markPublished(
  id: string,
  actorId: string,
  publishedAt: Date,
  options: { sendPush?: boolean } = {},
) {
  const updated = await updateCommunication(id, {
    status: CommunicationStatus.PUBLISHED,
    publishedAt,
    publishedByUserId: actorId,
    scheduledPublishAt: null,
  });
  await createAudit({
    action: "COMMUNICATION_PUBLISHED",
    actorUserId: actorId,
    communicationId: id,
  });
  await fanOutPublication(id, options);
  return updated;
}

export async function saveDraft(user: SessionUser | undefined, raw: unknown) {
  const actor = requireCommunicator(user);
  const parsed = communicationInputSchema.parse(raw);
  const category = await findCategoryById(parsed.categoryId);
  if (!category) throw new ValidationError("Categoria inválida.");
  const bodyHtml = sanitizeCommunicationHtml(parsed.bodyHtml);
  const created = await createCommunication({
    title: parsed.title,
    subtitle: parsed.subtitle ?? null,
    summary: parsed.summary,
    bodyHtml,
    coverPath: parsed.coverPath ?? null,
    categoryId: parsed.categoryId,
    authorUserId: actor.id,
    status: CommunicationStatus.DRAFT,
    priority: parsed.priority,
    expiresAt: parsed.expiresAt ?? null,
  });
  await createAudit({
    action: "COMMUNICATION_CREATED",
    actorUserId: actor.id,
    communicationId: created.id,
  });
  return created;
}

export async function updateDraft(user: SessionUser | undefined, id: string, raw: unknown) {
  const actor = requireCommunicator(user);
  const existing = await findCommunicationById(id);
  if (!existing) throw new NotFoundError("Comunicado não encontrado.");
  if (existing.status !== CommunicationStatus.DRAFT && existing.status !== CommunicationStatus.SCHEDULED) {
    throw new ValidationError("Somente rascunho ou agendado podem ser editados.");
  }
  const parsed = communicationInputSchema.parse(raw);
  const category = await findCategoryById(parsed.categoryId);
  if (!category) throw new ValidationError("Categoria inválida.");
  const updated = await updateCommunication(id, {
    title: parsed.title,
    subtitle: parsed.subtitle ?? null,
    summary: parsed.summary,
    bodyHtml: sanitizeCommunicationHtml(parsed.bodyHtml),
    coverPath: parsed.coverPath ?? null,
    categoryId: parsed.categoryId,
    priority: parsed.priority,
    expiresAt: parsed.expiresAt ?? null,
  });
  await createAudit({
    action: "COMMUNICATION_EDITED",
    actorUserId: actor.id,
    communicationId: id,
  });
  return updated;
}

export async function publishNow(user: SessionUser | undefined, id: string) {
  const actor = requireCommunicator(user);
  const existing = await findCommunicationById(id);
  if (!existing) throw new NotFoundError("Comunicado não encontrado.");
  if (existing.status !== CommunicationStatus.DRAFT && existing.status !== CommunicationStatus.SCHEDULED) {
    throw new ValidationError("Este comunicado não pode ser publicado.");
  }
  // Push vai pela API /api/push/dispatch (mesmo runtime do teste que funciona na Vercel).
  return markPublished(id, actor.id, new Date(), { sendPush: false });
}

export async function schedulePublication(user: SessionUser | undefined, id: string, scheduledPublishAt: Date) {
  const actor = requireCommunicator(user);
  const existing = await findCommunicationById(id);
  if (!existing) throw new NotFoundError("Comunicado não encontrado.");
  if (existing.status !== CommunicationStatus.DRAFT && existing.status !== CommunicationStatus.SCHEDULED) {
    throw new ValidationError("Somente rascunho pode ser agendado.");
  }
  try {
    assertFutureDate(scheduledPublishAt, new Date());
  } catch {
    throw new ValidationError(
      "A data de agendamento precisa ser futura (horário deste dispositivo / Brasília). Confira data e hora.",
    );
  }
  const updated = await updateCommunication(id, {
    status: CommunicationStatus.SCHEDULED,
    scheduledPublishAt,
  });
  await createAudit({
    action: "COMMUNICATION_EDITED",
    actorUserId: actor.id,
    communicationId: id,
    metadata: "scheduled",
  });
  return updated;
}

export async function cancelSchedule(user: SessionUser | undefined, id: string) {
  const actor = requireCommunicator(user);
  const existing = await findCommunicationById(id);
  if (!existing) throw new NotFoundError("Comunicado não encontrado.");
  if (existing.status !== CommunicationStatus.SCHEDULED) {
    throw new ValidationError("Somente agendado pode voltar a rascunho.");
  }
  const updated = await updateCommunication(id, {
    status: CommunicationStatus.DRAFT,
    scheduledPublishAt: null,
  });
  await createAudit({
    action: "SCHEDULE_CANCELLED",
    actorUserId: actor.id,
    communicationId: id,
  });
  return updated;
}

export async function cancelCommunication(user: SessionUser | undefined, id: string) {
  const actor = requireCommunicator(user);
  const existing = await findCommunicationById(id);
  if (!existing) throw new NotFoundError("Comunicado não encontrado.");
  if (existing.status !== CommunicationStatus.DRAFT && existing.status !== CommunicationStatus.SCHEDULED) {
    throw new ValidationError("Somente rascunho ou agendado podem ser cancelados.");
  }
  const updated = await updateCommunication(id, {
    status: CommunicationStatus.CANCELLED,
    scheduledPublishAt: null,
  });
  await createAudit({
    action: "COMMUNICATION_CANCELLED",
    actorUserId: actor.id,
    communicationId: id,
  });
  return updated;
}

export async function processScheduledJobs(now = new Date()) {
  const due = await listDueScheduled(now);
  const publishedIds: string[] = [];
  for (const item of due) {
    // Push no mesmo runtime do cron/RSC (não Server Action) — VAPID disponível.
    await markPublished(item.id, item.authorUserId, now, { sendPush: true });
    publishedIds.push(item.id);
  }
  const expired = await listDueExpired(now);
  for (const item of expired) {
    await updateCommunication(item.id, { status: CommunicationStatus.EXPIRED });
  }
  return { published: due.length, expired: expired.length, publishedIds };
}

export async function getHomeData(user: SessionUser | undefined) {
  const actor = requireUser(user);
  const now = new Date();
  const feed = await listPublishedForFeed(now, 12, actor.id);
  const unread = await listUnreadEligible(actor.id, now);
  const popup = selectUnreadPopup(unread);
  const featured = feed[0] ?? null;
  const latest = feed.slice(featured ? 1 : 0);
  const readIds = new Set(
    feed
      .filter((item) => item.reads.some((read) => read.acknowledgedAt != null))
      .map((item) => item.id),
  );
  return { featured, latest, popup, readIds, unreadCount: unread.length };
}

export async function getCommunicationForCollaborator(user: SessionUser | undefined, id: string) {
  const actor = requireUser(user);
  const item = await findCommunicationById(id);
  if (!item) throw new NotFoundError("Comunicado não encontrado.");
  const now = new Date();
  const visible = isVisibleToCollaborator(
    {
      id: item.id,
      status: item.status as "PUBLISHED",
      priority: item.priority as "NORMAL",
      audienceType: item.audienceType,
      publishedAt: item.publishedAt,
      expiresAt: item.expiresAt,
      scheduledPublishAt: item.scheduledPublishAt,
    },
    now,
  );
  const historyOk =
    item.status === CommunicationStatus.PUBLISHED || item.status === CommunicationStatus.EXPIRED;
  if (!visible && !historyOk) throw new NotFoundError("Comunicado não encontrado.");
  const read = await findRead(actor.id, id);
  return {
    item,
    userId: actor.id,
    acknowledged: Boolean(read?.acknowledgedAt),
    viewed: Boolean(read),
  };
}

/** Abertura do comunicado: visualização automática (não confirma ciência). */
export async function recordView(user: SessionUser | undefined, communicationId: string) {
  const actor = requireUser(user);
  const item = await findCommunicationById(communicationId);
  if (!item) throw new NotFoundError("Comunicado não encontrado.");
  await upsertView(actor.id, communicationId, new Date());
  await markNotificationOpenedByCommunication(actor.id, communicationId);
  await createAudit({
    action: "COMMUNICATION_VIEWED",
    actorUserId: actor.id,
    communicationId,
  });
  return { ok: true };
}

/** Confirmação explícita de ciência ("marcar como lido"). */
export async function acknowledgeRead(user: SessionUser | undefined, communicationId: string) {
  const actor = requireUser(user);
  const item = await findCommunicationById(communicationId);
  if (!item) throw new NotFoundError("Comunicado não encontrado.");
  await upsertAcknowledge(actor.id, communicationId, new Date());
  await markNotificationsForCommunication(actor.id, communicationId);
  await createAudit({
    action: "COMMUNICATION_ACKNOWLEDGED",
    actorUserId: actor.id,
    communicationId,
  });
  return { ok: true };
}

export async function getHistory(user: SessionUser | undefined, filters: Parameters<typeof searchHistory>[0]) {
  requireUser(user);
  return searchHistory(filters);
}

export async function getAdminList(user: SessionUser | undefined, filters: Parameters<typeof listAdmin>[0]) {
  requireCommunicator(user);
  return listAdmin(filters);
}

export async function getAdminAgenda(user: SessionUser | undefined) {
  requireCommunicator(user);
  return listScheduledAgenda(new Date());
}

export async function getAdminDashboard(user: SessionUser | undefined) {
  requireCommunicator(user);
  const eligible = await countEligibleCollaborators();
  const activeUsers = await countActiveUsers();
  const [counts, lowest, agenda, byDay, funnel] = await Promise.all([
    countByStatus(),
    lowestReadRate(eligible),
    listScheduledAgenda(new Date()),
    publicationsByDay(14),
    aggregateEngagementFunnel(eligible),
  ]);
  return {
    counts,
    eligible,
    activeUsers,
    lowest,
    agenda: agenda.slice(0, 4),
    byDay,
    funnel,
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
  };
}

export async function getCommunicationMetrics(user: SessionUser | undefined, id: string) {
  requireCommunicator(user);
  const item = await findCommunicationById(id);
  if (!item) throw new NotFoundError("Comunicado não encontrado.");
  const eligibleCount = await countEligibleCollaborators();
  const [viewedCount, acknowledgedCount, openedCount, inAppCount, deliveryGroups, readers] =
    await Promise.all([
      countViews(id),
      countAcknowledged(id),
      countOpenedNotifications(id),
      countInAppNotifications(id),
      countDeliveries(id),
      listReaders(id),
    ]);
  const deliveredInApp = deliveryGroups
    .filter((row) => row.channel === NotificationChannel.IN_APP && row.status === DeliveryStatus.SENT)
    .reduce((sum, row) => sum + row.count, 0);
  const pushSent = deliveryGroups
    .filter((row) => row.channel === NotificationChannel.WEB_PUSH && row.status === DeliveryStatus.SENT)
    .reduce((sum, row) => sum + row.count, 0);
  const pushFailed = deliveryGroups
    .filter((row) => row.channel === NotificationChannel.WEB_PUSH && row.status === DeliveryStatus.FAILED)
    .reduce((sum, row) => sum + row.count, 0);
  const metrics = computeObservabilityMetrics({
    eligibleCount,
    deliveredCount: Math.max(deliveredInApp, inAppCount),
    viewedCount,
    openedCount,
    acknowledgedCount,
  });
  return {
    item,
    metrics,
    delivery: {
      inApp: deliveredInApp || inAppCount,
      pushSent,
      pushFailed,
      groups: deliveryGroups,
    },
    readers,
    // compat antiga
    legacy: computeReadMetrics(eligibleCount, acknowledgedCount),
  };
}

export { listCategories };

export async function categoriesForUi() {
  return listCategories();
}
