import webPush from "web-push";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { defaultPushCopy } from "@/domain/communication-rules";
import { DeliveryStatus, NotificationChannel } from "@/types/communication";
import {
  deactivate,
  listActiveSubscriptions,
  listActiveSubscriptionsForUser,
  markUsed,
} from "@/repositories/push-repository";
import { logDelivery } from "@/repositories/notification-repository";
import { findCommunicationById } from "@/repositories/communication-repository";

export function vapidPublicKey(): string {
  const env = getEnv();
  return env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || env.WEB_PUSH_VAPID_PUBLIC_KEY;
}

function configureVapid(): { ok: true } | { ok: false; reason: string } {
  try {
    const env = getEnv();
    const publicKey = vapidPublicKey();
    const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return { ok: false, reason: "VAPID_NOT_CONFIGURED" };
    }
    webPush.setVapidDetails(env.WEB_PUSH_SUBJECT, publicKey, privateKey);
    return { ok: true };
  } catch (error) {
    logger.error("vapid_configure_failed", { error: String(error) });
    return { ok: false, reason: "VAPID_INVALID" };
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

async function dispatchToSubscriptions(
  subscriptions: Sub[],
  payload: PushPayload,
  options?: { communicationId?: string; log: boolean },
) {
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const communicationId = options?.communicationId;
  const shouldLog = Boolean(options?.log && communicationId);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
          { TTL: 60 * 60, urgency: payload.priority === "URGENT" ? "high" : "normal" },
        );
        await markUsed(subscription.id);
        if (shouldLog && communicationId) {
          await logDelivery({
            communicationId,
            userId: subscription.userId,
            channel: NotificationChannel.WEB_PUSH,
            status: DeliveryStatus.SENT,
          });
        }
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;
        const message = error instanceof Error ? error.message : String(error);
        if (statusCode === 404 || statusCode === 410) {
          await deactivate(subscription.id);
        }
        failed += 1;
        if (shouldLog && communicationId) {
          await logDelivery({
            communicationId,
            userId: subscription.userId,
            channel: NotificationChannel.WEB_PUSH,
            status: DeliveryStatus.FAILED,
            errorCode: statusCode ? String(statusCode) : message.slice(0, 180),
          });
        }
        logger.error("web_push_failed", { communicationId, statusCode, message });
      }
    }),
  );

  return { sent, failed };
}

export async function sendWebPushForPublication(communicationId: string) {
  const vapid = configureVapid();
  if (!vapid.ok) {
    await logDelivery({
      communicationId,
      channel: NotificationChannel.WEB_PUSH,
      status: DeliveryStatus.SKIPPED,
      errorCode: vapid.reason,
    });
    logger.warn("web_push_skipped", { communicationId, reason: vapid.reason });
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

  const result = await dispatchToSubscriptions(subscriptions, payload, {
    communicationId,
    log: true,
  });
  logger.info("web_push_batch_done", { communicationId, ...result, total: subscriptions.length });
  return { ...result, skipped: false as const };
}

/** Envia um push de teste só para o usuário atual (sem FK de comunicado). */
export async function sendTestPushToUser(userId: string) {
  const vapid = configureVapid();
  if (!vapid.ok) {
    return { ok: false as const, reason: vapid.reason, sent: 0, failed: 0 };
  }
  const subscriptions = await listActiveSubscriptionsForUser(userId);
  if (subscriptions.length === 0) {
    return { ok: false as const, reason: "NO_SUBSCRIPTIONS", sent: 0, failed: 0 };
  }
  const payload: PushPayload = {
    title: "Teste de notificação",
    body: "Se você viu este aviso com som, o Web Push está ok neste aparelho.",
    url: "/configuracoes",
    priority: "IMPORTANT",
  };
  const result = await dispatchToSubscriptions(subscriptions, payload, { log: false });
  return {
    ok: result.sent > 0,
    reason: result.sent > 0 ? "SENT" : "ALL_FAILED",
    ...result,
  };
}
