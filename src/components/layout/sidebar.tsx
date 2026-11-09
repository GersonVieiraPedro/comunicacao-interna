"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarClock, History, Home, Megaphone, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { appConfig } from "@/config/app";
import { hasCommunicatorRole, type AppRole } from "@/types/roles";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export function navItems(roles: AppRole[]): { href: string; label: string; icon: LucideIcon }[] {
  const items = [
    { href: "/", label: "Início", icon: Home },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/notificacoes", label: "Alertas", icon: Bell },
    { href: "/configuracoes", label: "Mais", icon: Settings },
  ];
  if (hasCommunicatorRole(roles)) {
    items.push({ href: "/admin", label: "Admin", icon: Megaphone });
    items.push({ href: "/admin/agenda", label: "Agenda", icon: CalendarClock });
  }
  return items;
}

export function Sidebar({ roles }: { roles: AppRole[] }) {
  const pathname = usePathname();
  const items = navItems(roles);

  return (
    <aside className="hidden w-[var(--sf-sidebar-w)] shrink-0 flex-col bg-accent text-white md:flex">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-spark/20 blur-2xl"
          aria-hidden
        />
        <div className="relative flex h-[var(--sf-header-h)] items-center gap-3 border-b border-white/10 px-5">
          <span className="h-8 w-1.5 rounded-full bg-spark" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">Meta RH</p>
            <Link href="/" className="block truncate text-sm font-semibold tracking-tight text-white">
              {appConfig.name}
            </Link>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3" aria-label="Principal">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-accent shadow-sm"
                  : "text-white/90 hover:bg-white/10",
              )}
            >
              <Icon icon={item.icon} className={cn(active ? "text-accent" : "text-white/90")} />
              {item.label}
              {active ? <span className="ml-auto h-2 w-2 rounded-full bg-spark" aria-hidden /> : null}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto px-5 pb-5 text-xs leading-relaxed text-white/50">
        Feito por e para pessoas
      </p>
    </aside>
  );
}
