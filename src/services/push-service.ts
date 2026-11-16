import webPush from "web-push";
import { logger } from "@/lib/logger";
import { cleanEnvSecret, cleanVapidSubject } from "@/lib/vapid";
import { defaultPushCopy } from "@/domain/communication-rules";
import { FANOUT_PUSH_CONCURRENCY, mapPool } from "@/domain/delivery-queue";
import { DeliveryStatus, NotificationChannel } from "@/types/communication";
import {
  deactivate,
  listActiveSubscriptions,
  markUsed,
} from "@/repositories/push-repository";
import { logDelivery } from "@/repositories/notification-repository";
import { findCommunicationById } from "@/repositories/communication-repository";

/** Lê VAPID com nomes literais (necessário no bundle de Server Actions na Vercel). */
function readVapidConfig() {
  const publicKey = cleanEnvSecret(
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
  );
  const privateKey = cleanEnvSecret(process.env.WEB_PUSH_VAPID_PRIVATE_KEY);
  const subject = cleanVapidSubject(process.env.WEB_PUSH_SUBJECT);
  return { publicKey, privateKey, subject };
}

export function vapidPublicKey(): string {
  return readVapidConfig().publicKey;
}

function configureVapid(): { ok: true } | { ok: false; reason: string } {
  try {
    const { publicKey, privateKey, subject } = readVapidConfig();
    if (!publicKey || !privateKey) {
      logger.warn("vapid_missing", {
        hasPublic: Boolean(publicKey),
        hasPrivate: Boolean(privateKey),
        subject,
      });
      return { ok: false, reason: "VAPID_NOT_CONFIGURED" };
    }
    webPush.setVapidDetails(subject, publicKey, privateKey);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("vapid_configure_failed", { error: message });
    return { ok: false, reason: `VAPID_INVALID:${message.slice(0, 120)}` };
  }
}

type PushPayload = {
  title: string;
  body: string;
  url: string;
  communicationId?: string;
  priority?: string;
};

type Sub = Awaited<ReturnType<typeof listActiveSubscriptions>>[number];

export async function sendWebPushBatch(
  communicationId: string,
  subscriptions: Sub[],
  options?: { concurrency?: number; log?: boolean },
) {
  const vapid = configureVapid();
  if (!vapid.ok) {
    if (options?.log !== false) {
      await logDelivery({
        communicationId,
        channel: NotificationChannel.WEB_PUSH,
        status: DeliveryStatus.SKIPPED,
        errorCode: vapid.reason.slice(0, 180),
      });
    }
    return { sent: 0, failed: 0, skipped: true as const };
  }

  const communication = await findCommunicationById(communicationId);
  const fallback = defaultPushCopy();
  const payload: PushPayload = {
    title: communication?.title?.slice(0, 80) || fallback.title,
    body: communication?.summary?.slice(0, 140) || fallback.body,
    url: `/comunicados/${communicationId}`,
    communicationId,
    priority: communication?.priority ?? "NORMAL",
  };
  const body = JSON.stringify(payload);
  const concurrency = options?.concurrency ?? FANOUT_PUSH_CONCURRENCY;
  const shouldLog = options?.log !== false;

  const outcomes = await mapPool(subscriptions, concurrency, async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        body,
        {
          TTL: 60 * 60,
          urgency: "high",
          headers: { Urgency: "high" },
        },
      );
      await markUsed(subscription.id);
      if (shouldLog) {
        await logDelivery({
          communicationId,
          userId: subscription.userId,
          channel: NotificationChannel.WEB_PUSH,
          status: DeliveryStatus.SENT,
        });
      }
      return "sent" as const;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0;
      const message = error instanceof Error ? error.message : String(error);
      if (statusCode === 404 || statusCode === 410) {
        await deactivate(subscription.id);
      }
      if (shouldLog) {
        await logDelivery({
          communicationId,
          userId: subscription.userId,
          channel: NotificationChannel.WEB_PUSH,
          status: DeliveryStatus.FAILED,
          errorCode: statusCode ? String(statusCode) : message.slice(0, 180),
        });
      }
      logger.error("web_push_failed", { communicationId, statusCode, message });
      return "failed" as const;
    }
  });

  const sent = outcomes.filter((item) => item === "sent").length;
  const failed = outcomes.filter((item) => item === "failed").length;
  return { sent, failed, skipped: false as const };
}

export async function sendWebPushForPublication(communicationId: string) {
  const subscriptions = await listActiveSubscriptions();
  if (subscriptions.length === 0) {
    await logDelivery({
      communicationId,
      channel: NotificationChannel.WEB_PUSH,
      status: DeliveryStatus.SKIPPED,
      errorCode: "NO_SUBSCRIPTIONS",
    });
    return { sent: 0, failed: 0, skipped: true as const };
  }

  // Mantém API legada: processa tudo, mas com concorrência limitada.
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < subscriptions.length; i += 40) {
    const page = subscriptions.slice(i, i + 40);
    const result = await sendWebPushBatch(communicationId, page, { log: true });
    sent += result.sent;
    failed += result.failed;
    if (result.skipped) {
      return { sent, failed, skipped: true as const };
    }
  }
  logger.info("web_push_batch_done", { communicationId, sent, failed, total: subscriptions.length });
  return { sent, failed, skipped: false as const };
}

/** Admin: envia "Notificação Teste" para todos os dispositivos ativos. */
export async function sendBroadcastTestPush() {
  const vapid = configureVapid();
  if (!vapid.ok) {
    return { ok: false as const, reason: vapid.reason, sent: 0, failed: 0 };
  }
  const subscriptions = await listActiveSubscriptions();
  if (subscriptions.length === 0) {
    return { ok: false as const, reason: "NO_SUBSCRIPTIONS", sent: 0, failed: 0 };
  }
  const body = JSON.stringify({
    title: "Notificação Teste",
    body: "Este é um aviso de teste do METARH NEWS.",
    url: "/",
    priority: "IMPORTANT",
  } satisfies PushPayload);

  let sent = 0;
  let failed = 0;
  await mapPool(subscriptions, FANOUT_PUSH_CONCURRENCY, async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        body,
        { TTL: 60 * 60, urgency: "high", headers: { Urgency: "high" } },
      );
      await markUsed(subscription.id);
      sent += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0;
      if (statusCode === 404 || statusCode === 410) {
        await deactivate(subscription.id);
      }
      failed += 1;
    }
  });

  logger.info("web_push_broadcast_test", { sent, failed, total: subscriptions.length });
  return {
    ok: sent > 0,
    reason: sent > 0 ? "SENT" : "ALL_FAILED",
    sent,
    failed,
  };
}
