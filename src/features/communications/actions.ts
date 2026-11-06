"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  acknowledgeRead,
  cancelCommunication,
  cancelSchedule,
  publishNow,
  saveDraft,
  schedulePublication,
  updateDraft,
} from "@/services/communication-service";
import { markNotificationRead } from "@/repositories/notification-repository";
import { requireUser } from "@/lib/authz";
import { toPublicError } from "@/lib/errors";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function payloadFromForm(formData: FormData) {
  const expires = formString(formData, "expiresAt");
  return {
    title: formString(formData, "title"),
    subtitle: formString(formData, "subtitle") || null,
    summary: formString(formData, "summary"),
    bodyHtml: formString(formData, "bodyHtml"),
    categoryId: formString(formData, "categoryId"),
    priority: formString(formData, "priority"),
    coverPath: formString(formData, "coverPath") || null,
    expiresAt: expires ? new Date(expires) : null,
  };
}

export async function actionSaveDraft(formData: FormData) {
  try {
    const session = await auth();
    const id = formString(formData, "id");
    const payload = payloadFromForm(formData);
    const saved = id
      ? await updateDraft(session?.user, id, payload)
      : await saveDraft(session?.user, payload);
    revalidatePath("/admin");
    return { ok: true as const, id: saved.id };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionPublish(formData: FormData) {
  try {
    const session = await auth();
    const id = formString(formData, "id");
    let communicationId = id;
    if (!communicationId) {
      const saved = await saveDraft(session?.user, payloadFromForm(formData));
      communicationId = saved.id;
    } else {
      await updateDraft(session?.user, id, payloadFromForm(formData)).catch(() => undefined);
    }
    await publishNow(session?.user, communicationId);
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true as const, id: communicationId };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionSchedule(formData: FormData) {
  try {
    const session = await auth();
    const scheduled = formString(formData, "scheduledPublishAt");
    if (!scheduled) return { ok: false as const, message: "Informe data e hora.", status: 400, code: "VALIDATION" };
    let id = formString(formData, "id");
    if (!id) {
      const saved = await saveDraft(session?.user, payloadFromForm(formData));
      id = saved.id;
    }
    await schedulePublication(session?.user, id, new Date(scheduled));
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionCancelSchedule(id: string) {
  try {
    const session = await auth();
    await cancelSchedule(session?.user, id);
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionCancel(id: string) {
  try {
    const session = await auth();
    await cancelCommunication(session?.user, id);
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionAcknowledge(communicationId: string) {
  try {
    const session = await auth();
    await acknowledgeRead(session?.user, communicationId);
    revalidatePath("/");
    revalidatePath(`/comunicados/${communicationId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionMarkNotification(id: string) {
  try {
    const session = await auth();
    const user = requireUser(session?.user);
    await markNotificationRead(id, user.id);
    revalidatePath("/notificacoes");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}
