import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const webPush = (await import("web-push")).default;
  const prisma = new PrismaClient();

  const publicKey =
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT || "mailto:teste@localhost";
  console.log({
    hasPublic: Boolean(publicKey),
    hasPrivate: Boolean(privateKey),
    subject,
    publicLen: publicKey?.length ?? 0,
  });
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys missing in .env.local");
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);

  const subs = await prisma.pushSubscription.findMany({ where: { active: true } });
  console.log("activeSubs", subs.length);
  for (const sub of subs) {
    try {
      const result = await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: "Teste Central",
          body: "Notificação de teste com som.",
          url: "/",
        }),
      );
      console.log("OK", sub.id, result.statusCode);
    } catch (e) {
      console.error("FAIL", sub.id, e);
    }
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
