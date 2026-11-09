import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { countUnreadNotifications } from "@/repositories/notification-repository";
import { processScheduledJobs } from "@/services/communication-service";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Hobby: cron só 1x/dia — publica agendados vencidos em qualquer visita autenticada.
  await processScheduledJobs().catch(() => undefined);
  const unreadNotifications = await countUnreadNotifications(session.user.id);
  return (
    <>
      <PwaRegister />
      <AppShell user={session.user} unreadNotifications={unreadNotifications}>
        {children}
      </AppShell>
    </>
  );
}
