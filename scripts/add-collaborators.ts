import { PrismaClient } from "@prisma/client";
import { AppRole } from "../src/types/roles";
import { credentialsSubject, hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();
const PASSWORD = "12345";

const USERS = [
  { email: "colaborador2@teste.com.br", displayName: "Colaborador 2" },
  { email: "colaborador3@teste.com.br", displayName: "Colaborador 3" },
] as const;

async function main() {
  const passwordHash = await hashPassword(PASSWORD);
  for (const person of USERS) {
    const email = person.email.toLowerCase();
    await prisma.user.upsert({
      where: { email },
      update: {
        displayName: person.displayName,
        passwordHash,
        entraObjectId: credentialsSubject(email),
        roles: {
          deleteMany: {},
          create: [{ role: AppRole.COLLABORATOR }],
        },
      },
      create: {
        entraObjectId: credentialsSubject(email),
        email,
        displayName: person.displayName,
        passwordHash,
        roles: { create: [{ role: AppRole.COLLABORATOR }] },
      },
    });
    console.log(`OK: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
