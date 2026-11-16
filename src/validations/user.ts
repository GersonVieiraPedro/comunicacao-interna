import { z } from "zod";
import { AppRole, ContractStatus, ContractType } from "@/types/roles";

export const passwordSchema = z
  .string()
  .min(8, "Senha com pelo menos 8 caracteres.")
  .max(128, "Senha muito longa.");

const roleEnum = z.enum([
  AppRole.METARH,
  AppRole.CLIENT,
  AppRole.COLLABORATOR,
  AppRole.CANDIDATE,
]);

const hrFields = {
  contractStatus: z
    .enum([ContractStatus.ACTIVE, ContractStatus.INACTIVE, ContractStatus.NONE])
    .nullable()
    .optional(),
  contractType: z
    .enum([ContractType.TEMPORARY, ContractType.THIRD_PARTY])
    .nullable()
    .optional(),
  economicGroup: z.string().trim().max(120).nullable().optional(),
  cnpj: z.string().trim().max(18).nullable().optional(),
  healthPlan: z.string().trim().max(120).nullable().optional(),
  reimbursementCard: z.string().trim().max(120).nullable().optional(),
  clientOrgId: z.string().trim().max(64).nullable().optional(),
};

export const createUserSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").max(200),
  displayName: z.string().trim().min(2, "Informe o nome.").max(120),
  password: passwordSchema,
  roles: z.array(roleEnum).min(1).default([AppRole.COLLABORATOR]),
  ...hrFields,
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(2).max(120).optional(),
  active: z.boolean().optional(),
  roles: z.array(roleEnum).min(1).optional(),
  password: passwordSchema.optional(),
  ...hrFields,
});

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(120).optional(),
    currentPassword: z.string().max(128).optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine(
    (value) => {
      if (value.newPassword && !value.currentPassword) return false;
      return true;
    },
    { message: "Informe a senha atual para trocar a senha.", path: ["currentPassword"] },
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
