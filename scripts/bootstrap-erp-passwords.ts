/**
 * Drena senhas temporárias ERP fora do Vercel (sem timeout de função).
 * Uso (na pasta do app, com DATABASE_URL no .env apontando pro banco certo):
 *   npx tsx scripts/bootstrap-erp-passwords.ts
 *   npx tsx scripts/bootstrap-erp-passwords.ts 200
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { tempPasswordForCodigo } from "../src/lib/temp-password";

const prisma = new PrismaClient();
const batchSize = Math.min(500, Math.max(1, Number(process.argv[2] || 100)));

async function main() {
  let total = 0;
  for (;;) {
    const pending = await prisma.user.findMany({
      where: {
        codigoFuncionario: { not: null },
        passwordHash: null,
        mustChangePassword: true,
      },
      select: { id: true, codigoFuncionario: true },
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    if (pending.length === 0) {
      console.log(JSON.stringify({ done: true, totalUpdated: total, batchSize }));
      break;
    }

    let updated = 0;
    for (const user of pending) {
      if (user.codigoFuncionario == null) continue;
      const hash = await hashPassword(tempPasswordForCodigo(user.codigoFuncionario));
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash, mustChangePassword: true },
      });
      updated += 1;
    }

    total += updated;
    console.log(JSON.stringify({ batchUpdated: updated, totalUpdated: total, batchSize }));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
