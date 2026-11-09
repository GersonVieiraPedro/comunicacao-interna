import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import type { SessionUser } from "@/lib/authz";
import type { ReactNode } from "react";

export function AppShell({
  user,
  unreadNotifications = 0,
  children,
}: {
  user: SessionUser;
  unreadNotifications?: number;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-transparent pb-[calc(var(--sf-bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0">
      <Sidebar roles={user.roles} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} unreadNotifications={unreadNotifications} />
        <main className="flex-1 px-4 py-5 md:px-8 md:py-7">{children}</main>
      </div>
      <BottomNav roles={user.roles} />
    </div>
  );
}
