import { logger } from "@/lib/logger";
import {
  advanceFanoutCursor,
  FANOUT_IN_APP_BATCH,
  FANOUT_MAX_ATTEMPTS,
  FANOUT_PUSH_BATCH,
  parseFanoutCursor,
  serializeFanoutCursor,
  shouldSendWebPush,
} from "@/domain/delivery-queue";
import { defaultPushCopy } from "@/domain/communication-rules";
import { DeliveryJobStatus, DeliveryStatus, NotificationChannel } from "@/types/communication";
import { findCommunicationById } from "@/repositories/communication-repository";
import {
  claimNextDeliveryJob,
  countPendingDeliveryJobs,
  countUsersMissingNotification,
  enqueueFanoutJob,
  failDeliveryJob,
  listUserIdsMissingNotification,
  saveDeliveryJobProgress,
} from "@/repositories/delivery-job-repository";
import {
  createNotificationsForUsers,
  logDeliveriesMany,
  logDelivery,
} from "@/repositories/notification-repository";
import {
  countActiveSubscriptions,
  listActiveSubscriptionsPage,
} from "@/repositories/push-repository";
import { sendWebPushBatch } from "@/services/push-service";

export async function enqueuePublicationFanout(communicationId: string) {
  const job = await enqueueFanoutJob(communicationId);
  logger.info("delivery_job_enqueued", { communicationId, jobId: job.id });
  return job;
}

async function processInAppChunk(communicationId: string) {
  const communication = await findCommunicationById(communicationId);
  const fallback = defaultPushCopy();
  const title = communication?.title?.slice(0, 120) || fallback.title;
  const body = communication?.summary?.slice(0, 200) || fallback.body;
  const userIds = await listUserIdsMissingNotification(communicationId, FANOUT_IN_APP_BATCH);
  if (userIds.length === 0) {
    return { processed: 0, remaining: 0 };
  }
  await createNotificationsForUsers({ userIds, communicationId, title, body });
  await logDeliveriesMany(
    userIds.map((userId) => ({
      communicationId,
      userId,
      channel: NotificationChannel.IN_APP,
      status: DeliveryStatus.SENT,
    })),
  );
  const remaining = await countUsersMissingNotification(communicationId);
  return { processed: userIds.length, remaining };
}

async function processPushChunk(communicationId: string, offset: number) {
  const total = await countActiveSubscriptions();
  if (total === 0) {
    await logDelivery({
      communicationId,
      channel: NotificationChannel.WEB_PUSH,
      status: DeliveryStatus.SKIPPED,
      errorCode: "NO_SUBSCRIPTIONS",
    });
    return { processed: 0, total: 0 };
  }
  const page = await listActiveSubscriptionsPage(offset, FANOUT_PUSH_BATCH);
  if (page.length === 0) {
    return { processed: 0, total };
  }
  await sendWebPushBatch(communicationId, page, { log: true });
  return { processed: page.length, total };
}

async function processOneJob(timeBudgetMs: number) {
  const started = Date.now();
  const job = await claimNextDeliveryJob();
  if (!job) return { claimed: false as const };

  try {
    let cursor = parseFanoutCursor(job.cursor);
    let chunks = 0;

    while (Date.now() - started < timeBudgetMs && chunks < 6) {
      chunks += 1;
      if (cursor.phase === "in_app") {
        const result = await processInAppChunk(job.communicationId);
        const next = advanceFanoutCursor({
          cursor,
          inAppRemaining: result.remaining,
          pushProcessed: 0,
          pushTotal: 0,
        });
        if (!next) {
          await saveDeliveryJobProgress(job.id, {
            cursor: null,
            status: DeliveryJobStatus.COMPLETED,
            completedAt: new Date(),
          });
          return { claimed: true as const, completed: true, jobId: job.id };
        }
        // Normal: só in-app. Importante/urgente: segue para push.
        if (next.phase === "push") {
          const communication = await findCommunicationById(job.communicationId);
          if (!shouldSendWebPush(communication?.priority)) {
            await logDelivery({
              communicationId: job.communicationId,
              channel: NotificationChannel.WEB_PUSH,
              status: DeliveryStatus.SKIPPED,
              errorCode: "PRIORITY_IN_APP_ONLY",
            });
            await saveDeliveryJobProgress(job.id, {
              cursor: null,
              status: DeliveryJobStatus.COMPLETED,
              completedAt: new Date(),
            });
            return { claimed: true as const, completed: true, jobId: job.id };
          }
        }
        cursor = next;
        await saveDeliveryJobProgress(job.id, { cursor: serializeFanoutCursor(cursor) });
        continue;
      }

      const push = await processPushChunk(job.communicationId, cursor.offset);
      const next = advanceFanoutCursor({
        cursor,
        inAppRemaining: 0,
        pushProcessed: push.processed,
        pushTotal: push.total,
      });
      if (!next) {
        await saveDeliveryJobProgress(job.id, {
          cursor: null,
          status: DeliveryJobStatus.COMPLETED,
          completedAt: new Date(),
        });
        logger.info("delivery_job_completed", { jobId: job.id, communicationId: job.communicationId });
        return { claimed: true as const, completed: true, jobId: job.id };
      }
      cursor = next;
      await saveDeliveryJobProgress(job.id, { cursor: serializeFanoutCursor(cursor) });
    }

    // Ainda há trabalho: deixa PENDING para o próximo tick
    await saveDeliveryJobProgress(job.id, {
      cursor: serializeFanoutCursor(cursor),
      status: DeliveryJobStatus.PENDING,
    });
    return { claimed: true as const, completed: false, jobId: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const attempts = job.attempts;
    const retry =
      attempts < FANOUT_MAX_ATTEMPTS
        ? new Date(Date.now() + Math.min(60_000, 2 ** Math.min(attempts, 5) * 1000))
        : null;
    await failDeliveryJob(job.id, message, retry);
    logger.error("delivery_job_failed", {
      jobId: job.id,
      communicationId: job.communicationId,
      attempts,
      message,
      retry: Boolean(retry),
    });
    return { claimed: true as const, completed: false, failed: true, jobId: job.id };
  }
}

/** Processa a fila com orçamento de tempo (layout, cron, after). */
export async function processDeliveryQueue(options?: {
  maxJobs?: number;
  timeBudgetMs?: number;
}) {
  const maxJobs = options?.maxJobs ?? 2;
  const timeBudgetMs = options?.timeBudgetMs ?? 8_000;
  const deadline = Date.now() + timeBudgetMs;
  let processed = 0;
  let completed = 0;

  while (processed < maxJobs && Date.now() < deadline) {
    const remainingMs = Math.max(500, deadline - Date.now());
    const result = await processOneJob(remainingMs);
    if (!result.claimed) break;
    processed += 1;
    if (result.completed) completed += 1;
  }

  const pending = await countPendingDeliveryJobs();
  if (processed > 0) {
    logger.info("delivery_queue_tick", { processed, completed, pending });
  }
  return { processed, completed, pending };
}
