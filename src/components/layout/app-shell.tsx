import { Sidebar, navItems } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { SessionUser } from "@/lib/authz";
import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function AppShell({
  user,
  unreadNotifications = 0,
  children,
}: {
  user: SessionUser;
  unreadNotifications?: number;
  children: ReactNode;
}) {
  const items = navItems(user.roles);
  return (
    <div className="flex min-h-screen bg-bg pb-16 md:pb-0">
      <Sidebar roles={user.roles} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} unreadNotifications={unreadNotifications} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
        aria-label="Navegação inferior"
      >
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium text-fg"
          >
            <Icon icon={item.icon} className="h-5 w-5 text-accent" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
