import type { SessionUser } from "@/lib/authz";
import { requireMetarh, requireUser } from "@/lib/authz";
import { AppRole, resolveEffectiveRole } from "@/types/roles";
import { AudienceType } from "@/types/audience";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { sanitizeCommunicationHtml } from "@/lib/sanitize-html";
import {
  computeObservabilityMetrics,
  computeReadMetrics,
  isVisibleToCollaborator,
  selectUnreadPopup,
} from "@/domain/communication-rules";
import { assertFutureDate } from "@/lib/datetime";
import { CommunicationStatus, DeliveryStatus, NotificationChannel } from "@/types/communication";
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
  listDueExpired,
  listDueScheduled,
  listPublishedForFeed,
  listReaders,
  listScheduledAgenda,
  listUnreadEligible,
  lowestReadRate,
  publicationsByDay,
  replaceCommunicationTargets,
  searchHistory,
  updateCommunication,
  upsertAcknowledge,
  upsertView,
} from "@/repositories/communication-repository";
import { countUsersMatchingAudience } from "@/repositories/user-repository";
import {
  countDeliveries,
  countInAppNotifications,
  countOpenedNotifications,
  markNotificationOpenedByCommunication,
  markNotificationsForCommunication,
} from "@/repositories/notification-repository";
import {
  countActivePushSubscriptions,
  countActiveUsers,
  countUsersWithActivePush,
} from "@/repositories/user-repository";
import { enqueuePublicationFanout } from "@/services/delivery-queue-service";

async function markPublished(id: string, actorId: string, publishedAt: Date) {
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
  // Fan-out (in-app + push) vai para a fila — resposta de publicar não espera 300 envios.
  await enqueuePublicationFanout(id);
  return updated;
}

async function persistAudience(
  communicationId: string,
  audienceType: string,
  targets: Array<{ targetType: string; targetValue: string }>,
) {
  const normalizedType =
    audienceType === AudienceType.FILTERED && targets.length > 0
      ? AudienceType.FILTERED
      : AudienceType.ALL;
  await updateCommunication(communicationId, { audienceType: normalizedType });
  await replaceCommunicationTargets(
    communicationId,
    normalizedType === AudienceType.FILTERED ? targets : [],
  );
  return normalizedType;
}

export async function saveDraft(user: SessionUser | undefined, raw: unknown) {
  const actor = requireMetarh(user);
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
    audienceType: parsed.audienceType,
  });
  await persistAudience(created.id, parsed.audienceType, parsed.targets);
  await createAudit({
    action: "COMMUNICATION_CREATED",
    actorUserId: actor.id,
    communicationId: created.id,
  });
  return created;
}

export async function updateDraft(user: SessionUser | undefined, id: string, raw: unknown) {
  const actor = requireMetarh(user);
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
  await persistAudience(id, parsed.audienceType, parsed.targets);
  await createAudit({
    action: "COMMUNICATION_EDITED",
    actorUserId: actor.id,
    communicationId: id,
  });
  return updated;
}

export async function previewAudienceCount(
  user: SessionUser | undefined,
  input: { audienceType: string; targets: Array<{ targetType: string; targetValue: string }> },
) {
  requireMetarh(user);
  return countUsersMatchingAudience(input);
}

export async function publishNow(user: SessionUser | undefined, id: string) {
  const actor = requireMetarh(user);
  const existing = await findCommunicationById(id);
  if (!existing) throw new NotFoundError("Comunicado não encontrado.");
  if (existing.status !== CommunicationStatus.DRAFT && existing.status !== CommunicationStatus.SCHEDULED) {
    throw new ValidationError("Este comunicado não pode ser publicado.");
  }
  return markPublished(id, actor.id, new Date());
}

export async function schedulePublication(user: SessionUser | undefined, id: string, scheduledPublishAt: Date) {
  const actor = requireMetarh(user);
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
  const actor = requireMetarh(user);
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
  const actor = requireMetarh(user);
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
    await markPublished(item.id, item.authorUserId, now);
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
  const effectiveRole =
    actor.effectiveRole ??
    resolveEffectiveRole({ roles: actor.roles, contractStatus: actor.contractStatus });

  if (effectiveRole === AppRole.CANDIDATE) {
    return {
      featured: null,
      latest: [],
      popup: null,
      readIds: new Set<string>(),
      unreadCount: 0,
      effectiveRole,
    };
  }

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
  return { featured, latest, popup, readIds, unreadCount: unread.length, effectiveRole };
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
  requireMetarh(user);
  return listAdmin(filters);
}

export async function getAdminAgenda(user: SessionUser | undefined) {
  requireMetarh(user);
  return listScheduledAgenda(new Date());
}

export async function getAdminDashboard(user: SessionUser | undefined) {
  requireMetarh(user);
  const eligible = await countEligibleCollaborators();
  const [counts, lowest, agenda, byDay, funnel, activeUsers, pushUsers, pushDevices] =
    await Promise.all([
      countByStatus(),
      lowestReadRate(eligible),
      listScheduledAgenda(new Date()),
      publicationsByDay(14),
      aggregateEngagementFunnel(eligible),
      countActiveUsers(),
      countUsersWithActivePush(),
      countActivePushSubscriptions(),
    ]);
  return {
    counts,
    eligible,
    activeUsers,
    pushUsers,
    pushDevices,
    lowest,
    agenda: agenda.slice(0, 4),
    byDay,
    funnel,
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
  };
}

export async function getCommunicationMetrics(user: SessionUser | undefined, id: string) {
  requireMetarh(user);
  const item = await findCommunicationById(id);
  if (!item) throw new NotFoundError("Comunicado não encontrado.");
  const eligibleCount = await countUsersMatchingAudience({
    audienceType: item.audienceType,
    targets: item.targets.map((target) => ({
      targetType: target.targetType,
      targetValue: target.targetValue,
    })),
  });
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
