import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { tempPasswordForCodigo } from "@/lib/temp-password";
import { logger } from "@/lib/logger";

/** Executa a procedure MERGE (SQL Server). */
export async function runErpUserMergeProcedure() {
  try {
    await prisma.$executeRawUnsafe(`EXEC [comunicacao].[usp_SyncUsersFromErp]`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("erp_merge_procedure_failed", { message: message.slice(0, 400) });
    throw error;
  }
}

/**
 * Aplica senha temporária bcrypt em usuários ERP sem hash
 * (mustChangePassword=true, passwordHash null, codigoFuncionario set).
 */
export async function bootstrapErpTempPasswords(limit = 500) {
  const pending = await prisma.user.findMany({
    where: {
      codigoFuncionario: { not: null },
      passwordHash: null,
      mustChangePassword: true,
    },
    select: { id: true, codigoFuncionario: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  for (const user of pending) {
    if (user.codigoFuncionario == null) continue;
    const hash = await hashPassword(tempPasswordForCodigo(user.codigoFuncionario));
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        mustChangePassword: true,
      },
    });
    updated += 1;
  }

  logger.info("erp_temp_passwords_bootstrapped", { updated, scanned: pending.length });
  return { updated, scanned: pending.length };
}

export async function syncErpUsers(options?: { bootstrapPasswords?: boolean; passwordBatch?: number }) {
  await runErpUserMergeProcedure();
  const passwords =
    options?.bootstrapPasswords === false
      ? { updated: 0, scanned: 0 }
      : await bootstrapErpTempPasswords(options?.passwordBatch ?? 100);
  return { merge: true as const, passwords };
}
