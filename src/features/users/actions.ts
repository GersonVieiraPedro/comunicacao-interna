"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { toPublicError } from "@/lib/errors";
import { createUser, updateProfile, updateUser } from "@/services/user-service";
import { AppRole } from "@/types/roles";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function rolesFromForm(formData: FormData) {
  const roles: Array<"COLLABORATOR" | "COMMUNICATOR"> = [AppRole.COLLABORATOR];
  if (formData.get("roleCommunicator") === "on" || formData.get("roleCommunicator") === "true") {
    roles.push(AppRole.COMMUNICATOR);
  }
  return roles;
}

export async function actionCreateUser(formData: FormData) {
  try {
    const session = await auth();
    await createUser(session?.user, {
      email: formString(formData, "email"),
      displayName: formString(formData, "displayName"),
      password: formString(formData, "password"),
      roles: rolesFromForm(formData),
    });
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionUpdateUser(formData: FormData) {
  try {
    const session = await auth();
    const password = formString(formData, "password");
    await updateUser(session?.user, {
      id: formString(formData, "id"),
      displayName: formString(formData, "displayName") || undefined,
      active: formString(formData, "active") === "true",
      roles: rolesFromForm(formData),
      ...(password ? { password } : {}),
    });
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionToggleUserActive(id: string, active: boolean) {
  try {
    const session = await auth();
    await updateUser(session?.user, { id, active });
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}

export async function actionUpdateProfile(formData: FormData) {
  try {
    const session = await auth();
    const newPassword = formString(formData, "newPassword");
    await updateProfile(session?.user, {
      displayName: formString(formData, "displayName") || undefined,
      currentPassword: formString(formData, "currentPassword") || undefined,
      ...(newPassword ? { newPassword } : {}),
    });
    revalidatePath("/configuracoes");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, ...toPublicError(error) };
  }
}
