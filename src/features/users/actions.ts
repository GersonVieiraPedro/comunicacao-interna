"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { toPublicError } from "@/lib/errors";
import { createUser, updateProfile, updateUser } from "@/services/user-service";
import { AppRole, ContractStatus, ContractType } from "@/types/roles";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function rolesFromForm(formData: FormData) {
  const profile = formString(formData, "profileRole") || AppRole.COLLABORATOR;
  if (profile === AppRole.METARH) return [AppRole.METARH, AppRole.COLLABORATOR];
  if (profile === AppRole.CLIENT) return [AppRole.CLIENT];
  if (profile === AppRole.CANDIDATE) return [AppRole.CANDIDATE];
  return [AppRole.COLLABORATOR];
}

function hrFromForm(formData: FormData) {
  const contractStatus = formString(formData, "contractStatus");
  const contractType = formString(formData, "contractType");
  return {
    contractStatus: (Object.values(ContractStatus) as string[]).includes(contractStatus)
      ? (contractStatus as (typeof ContractStatus)[keyof typeof ContractStatus])
      : null,
    contractType: (Object.values(ContractType) as string[]).includes(contractType)
      ? (contractType as (typeof ContractType)[keyof typeof ContractType])
      : null,
    economicGroup: emptyToNull(formString(formData, "economicGroup")),
    cnpj: emptyToNull(formString(formData, "cnpj")),
    healthPlan: emptyToNull(formString(formData, "healthPlan")),
    reimbursementCard: emptyToNull(formString(formData, "reimbursementCard")),
    clientOrgId: emptyToNull(formString(formData, "clientOrgId")),
  };
}

export async function actionCreateUser(formData: FormData) {
  try {
    const session = await auth();
    await createUser(session?.user, {
      email: formString(formData, "email"),
      displayName: formString(formData, "displayName"),
      password: formString(formData, "password"),
      roles: rolesFromForm(formData),
      ...hrFromForm(formData),
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
      ...hrFromForm(formData),
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
