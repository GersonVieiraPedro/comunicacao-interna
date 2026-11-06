import { describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("prisma", () => {
  it("conecta no banco de teste", async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.$queryRaw`SELECT 1`;
    expect(true).toBe(true);
    await prisma.$disconnect();
  });
});
