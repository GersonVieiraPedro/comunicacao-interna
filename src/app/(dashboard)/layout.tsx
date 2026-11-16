import { after } from "next/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { countUnreadNotifications } from "@/repositories/notification-repository";
import { processScheduledJobs } from "@/services/communication-service";
import { processDeliveryQueue } from "@/services/delivery-queue-service";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Não bloquear navegação: agenda/fila rodam depois da resposta.
  after(() => {
    void processScheduledJobs().catch(() => undefined);
    void processDeliveryQueue({ maxJobs: 1, timeBudgetMs: 4_000 }).catch(() => undefined);
  });

  const unreadNotifications = await countUnreadNotifications(session.user.id).catch(() => 0);

  return (
    <>
      <PwaRegister />
      <AppShell user={session.user} unreadNotifications={unreadNotifications}>
        {children}
      </AppShell>
    </>
  );
}
