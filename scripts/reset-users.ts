/**
 * Apaga usuários (e dados que bloqueiam FK) e cria 3 contas de teste.
 * Uso: npx tsx scripts/reset-users.ts
 */
import { PrismaClient } from "@prisma/client";
import { AppRole } from "../src/types/roles";
import { credentialsSubject, hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();
const PASSWORD = "12345";

const USERS = [
  {
    email: "colaborador@teste.com.br",
    displayName: "Colaborador Teste",
    roles: [AppRole.COLLABORATOR],
  },
  {
    email: "comunicador@teste.com.br",
    displayName: "Comunicador Teste",
    roles: [AppRole.COLLABORATOR, AppRole.COMMUNICATOR],
  },
  {
    email: "gersonvieira@metarh.com.br",
    displayName: "Gerson Vieira",
    roles: [AppRole.COLLABORATOR, AppRole.COMMUNICATOR],
  },
] as const;

async function main() {
  console.log("Limpando dados que referenciam usuários...");
  await prisma.notificationDelivery.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.communicationRead.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.communicationTarget.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.userRole.deleteMany();
  const deleted = await prisma.user.deleteMany();
  console.log(`Usuários removidos: ${deleted.count}`);

  const passwordHash = await hashPassword(PASSWORD);
  for (const person of USERS) {
    const email = person.email.toLowerCase();
    await prisma.user.create({
      data: {
        entraObjectId: credentialsSubject(email),
        email,
        displayName: person.displayName,
        passwordHash,
        roles: { create: person.roles.map((role) => ({ role })) },
      },
    });
    console.log(`Criado: ${email} → ${person.roles.join(", ")}`);
  }

  console.log("Pronto. Senha de todos: 12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
