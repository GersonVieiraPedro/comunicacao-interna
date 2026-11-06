import webPush from "web-push";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { defaultPushCopy } from "@/domain/communication-rules";
import { DeliveryStatus, NotificationChannel } from "@/types/communication";
import {
  deactivate,
  listActiveSubscriptions,
  markUsed,
} from "@/repositories/push-repository";
import { logDelivery } from "@/repositories/notification-repository";

export function vapidPublicKey(): string {
  const env = getEnv();
  return env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || env.WEB_PUSH_VAPID_PUBLIC_KEY;
}

function configureVapid() {
  const env = getEnv();
  const publicKey = vapidPublicKey();
  const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webPush.setVapidDetails(env.WEB_PUSH_SUBJECT, publicKey, privateKey);
  return true;
}

export async function sendWebPushForPublication(communicationId: string) {
  if (!configureVapid()) {
    await logDelivery({
      communicationId,
      channel: NotificationChannel.WEB_PUSH,
      status: DeliveryStatus.SKIPPED,
      errorCode: "VAPID_NOT_CONFIGURED",
    });
    return { sent: 0, failed: 0, skipped: true };
  }

  const copy = defaultPushCopy();
  const payload = JSON.stringify({
    title: copy.title,
    body: copy.body,
    url: `/comunicados/${communicationId}`,
    communicationId,
  });

  const subscriptions = await listActiveSubscriptions();
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
      );
      await markUsed(subscription.id);
      await logDelivery({
        communicationId,
        userId: subscription.userId,
        channel: NotificationChannel.WEB_PUSH,
        status: DeliveryStatus.SENT,
      });
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
      await logDelivery({
        communicationId,
        userId: subscription.userId,
        channel: NotificationChannel.WEB_PUSH,
        status: DeliveryStatus.FAILED,
        errorCode: statusCode ? String(statusCode) : "SEND_FAILED",
      });
      logger.error("web_push_failed", { communicationId, statusCode });
    }
  }

  return { sent, failed, skipped: false };
}
