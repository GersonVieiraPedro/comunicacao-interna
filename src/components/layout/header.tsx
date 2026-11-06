import type { SessionUser } from "@/lib/authz";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationBellLink } from "@/components/notifications/notification-bell-link";
import { appConfig } from "@/config/app";
import { Icon } from "@/components/ui/icon";
import { Search, User } from "lucide-react";
import Link from "next/link";

export function Header({ user, unreadNotifications = 0 }: { user: SessionUser; unreadNotifications?: number }) {
  return (
    <header className="flex h-[var(--sf-header-h)] items-center justify-between gap-3 border-b border-border bg-surface px-4">
      <Link href="/" className="text-sm font-semibold text-accent md:hidden">
        Central
      </Link>
      <form action="/historico" className="hidden min-w-0 flex-1 md:block" role="search">
        <label className="sr-only" htmlFor="header-search">
          Buscar comunicados
        </label>
        <div className="relative max-w-md">
          <Icon icon={Search} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            id="header-search"
            name="q"
            placeholder="Buscar comunicados"
            className="w-full rounded-md border border-border bg-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
      </form>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBellLink count={unreadNotifications} />
        <span className="hidden items-center gap-2 text-sm text-fg sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-accent">
            <Icon icon={User} />
          </span>
          {user.name}
        </span>
        <span className="sr-only">{appConfig.name}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
