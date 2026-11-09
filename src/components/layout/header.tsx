import type { SessionUser } from "@/lib/authz";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationBellLink } from "@/components/notifications/notification-bell-link";
import { appConfig } from "@/config/app";
import { Icon } from "@/components/ui/icon";
import { Search, User } from "lucide-react";
import Link from "next/link";

export function Header({ user, unreadNotifications = 0 }: { user: SessionUser; unreadNotifications?: number }) {
  const firstName = user.name?.split(/\s+/)[0] ?? user.name;

  return (
    <header className="sticky top-0 z-30 flex h-[var(--sf-header-h)] items-center justify-between gap-3 border-b border-border/80 bg-surface/90 px-4 backdrop-blur-md md:px-6">
      <Link href="/" className="min-w-0 md:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent/70">Meta RH</p>
        <p className="truncate text-sm font-semibold text-fg">Central</p>
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
            placeholder="Buscar comunicados…"
            className="w-full rounded-full border border-border bg-bg py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow placeholder:text-fg-muted/80 focus:border-accent focus:shadow-sm"
          />
        </div>
      </form>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBellLink count={unreadNotifications} />
        <Link
          href="/configuracoes"
          className="hidden items-center gap-2 rounded-full border border-border bg-bg py-1 pl-1 pr-3 transition hover:border-accent/30 sm:flex"
          title="Perfil e configurações"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {(firstName?.[0] ?? "U").toUpperCase()}
          </span>
          <span className="max-w-[9rem] truncate text-sm font-medium text-fg">{firstName}</span>
          <span className="sr-only">
            <Icon icon={User} />
            {appConfig.name}
          </span>
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
