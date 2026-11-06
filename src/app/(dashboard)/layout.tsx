import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { countUnreadNotifications } from "@/repositories/notification-repository";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
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
