"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { toPublicError } from "@/lib/errors";
import {
  createFaq,
  createUsefulLink,
  removeFaq,
  removeUsefulLink,
  updateFaq,
  updateUsefulLink,
} from "@/services/content-service";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function actionCreateFaq(formData: FormData) {
  try {
    const session = await auth();
    await createFaq(session?.user, {
      question: formString(formData, "question"),
      answer: formString(formData, "answer"),
      sortOrder: formString(formData, "sortOrder") || undefined,
    });
    revalidatePath("/faq");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionUpdateFaq(formData: FormData) {
  try {
    const session = await auth();
    await updateFaq(session?.user, {
      id: formString(formData, "id"),
      question: formString(formData, "question") || undefined,
      answer: formString(formData, "answer") || undefined,
      sortOrder: formString(formData, "sortOrder") || undefined,
      active: formString(formData, "active") === "true",
    });
    revalidatePath("/faq");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionDeleteFaq(id: string) {
  try {
    const session = await auth();
    await removeFaq(session?.user, id);
    revalidatePath("/faq");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionCreateUsefulLink(formData: FormData) {
  try {
    const session = await auth();
    await createUsefulLink(session?.user, {
      label: formString(formData, "label"),
      href: formString(formData, "href"),
      description: emptyToNull(formString(formData, "description")),
      sortOrder: formString(formData, "sortOrder") || undefined,
    });
    revalidatePath("/faq");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionUpdateUsefulLink(formData: FormData) {
  try {
    const session = await auth();
    await updateUsefulLink(session?.user, {
      id: formString(formData, "id"),
      label: formString(formData, "label") || undefined,
      href: formString(formData, "href") || undefined,
      description: emptyToNull(formString(formData, "description")),
      sortOrder: formString(formData, "sortOrder") || undefined,
      active: formString(formData, "active") === "true",
    });
    revalidatePath("/faq");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionDeleteUsefulLink(id: string) {
  try {
    const session = await auth();
    await removeUsefulLink(session?.user, id);
    revalidatePath("/faq");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}
