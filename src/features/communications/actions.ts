"use server";

import { after } from "next/server";
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
import { processDeliveryQueue } from "@/services/delivery-queue-service";
import { markNotificationRead } from "@/repositories/notification-repository";
import { requireUser } from "@/lib/authz";
import { parseDateTimeLocalInput } from "@/lib/datetime";
import { toPublicError, ValidationError } from "@/lib/errors";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseOptionalDate(value: string): Date | null {
  if (!value.trim()) return null;
  try {
    return parseDateTimeLocalInput(value);
  } catch {
    throw new ValidationError("Data/hora inválida.");
  }
}

function targetsFromForm(formData: FormData) {
  const audienceType = formString(formData, "audienceType") || "ALL";
  if (audienceType !== "FILTERED") return { audienceType: "ALL" as const, targets: [] };

  const pairs: Array<{ targetType: string; targetValue: string }> = [];
  const add = (targetType: string, key: string) => {
    const targetValue = formString(formData, key).trim();
    if (targetValue) pairs.push({ targetType, targetValue });
  };
  add("CONTRACT_STATUS", "filterContractStatus");
  add("CONTRACT_TYPE", "filterContractType");
  add("ECONOMIC_GROUP", "filterEconomicGroup");
  add("CNPJ", "filterCnpj");
  add("HEALTH_PLAN", "filterHealthPlan");
  add("REIMBURSEMENT_CARD", "filterReimbursementCard");
  add("USER_ID", "filterUserId");
  return { audienceType: "FILTERED" as const, targets: pairs };
}

function payloadFromForm(formData: FormData) {
  const expires = formString(formData, "expiresAt");
  const expiresAt = parseOptionalDate(expires);
  const audience = targetsFromForm(formData);
  return {
    title: formString(formData, "title"),
    subtitle: formString(formData, "subtitle") || null,
    summary: formString(formData, "summary"),
    bodyHtml: formString(formData, "bodyHtml"),
    categoryId: formString(formData, "categoryId"),
    priority: formString(formData, "priority"),
    coverPath: formString(formData, "coverPath") || null,
    expiresAt,
    ...audience,
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
    // Continua o fan-out depois da resposta (não prende o “publicado”).
    after(() => {
      void processDeliveryQueue({ maxJobs: 3, timeBudgetMs: 20_000 });
    });
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
    if (!scheduled) {
      return { ok: false as const, message: "Informe data e hora.", status: 400, code: "VALIDATION" };
    }
    let scheduledAt: Date;
    try {
      scheduledAt = parseDateTimeLocalInput(scheduled);
    } catch {
      return {
        ok: false as const,
        message: "Data/hora de agendamento inválida.",
        status: 400,
        code: "VALIDATION",
      };
    }
    let id = formString(formData, "id");
    if (!id) {
      const saved = await saveDraft(session?.user, payloadFromForm(formData));
      id = saved.id;
    } else {
      await updateDraft(session?.user, id, payloadFromForm(formData)).catch(() => undefined);
    }
    await schedulePublication(session?.user, id, scheduledAt);
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
