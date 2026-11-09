import { z } from "zod";
import { AppRole } from "@/types/roles";

export const passwordSchema = z
  .string()
  .min(8, "Senha com pelo menos 8 caracteres.")
  .max(128, "Senha muito longa.");

export const createUserSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").max(200),
  displayName: z.string().trim().min(2, "Informe o nome.").max(120),
  password: passwordSchema,
  roles: z
    .array(z.enum([AppRole.COLLABORATOR, AppRole.COMMUNICATOR]))
    .min(1)
    .default([AppRole.COLLABORATOR]),
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(2).max(120).optional(),
  active: z.boolean().optional(),
  roles: z.array(z.enum([AppRole.COLLABORATOR, AppRole.COMMUNICATOR])).min(1).optional(),
  password: passwordSchema.optional(),
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
