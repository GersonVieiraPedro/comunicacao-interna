"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarClock,
  History,
  Home,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { appConfig } from "@/config/app";
import { hasCommunicatorRole, type AppRole } from "@/types/roles";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "sf-sidebar-collapsed";

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

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/admin") {
    return (
      pathname === "/admin" ||
      (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/agenda"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ roles }: { roles: AppRole[] }) {
  const pathname = usePathname();
  const items = navItems(roles);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-accent text-white transition-[width] duration-200 md:flex",
          collapsed ? "w-[var(--sf-sidebar-collapsed-w)]" : "w-[var(--sf-sidebar-w)]",
          !ready && "opacity-0",
        )}
        aria-label="Menu lateral"
      >
        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-spark/20 blur-2xl"
            aria-hidden
          />
          <div
            className={cn(
              "relative flex h-[var(--sf-header-h)] items-center border-b border-white/10",
              collapsed ? "justify-center px-2" : "gap-3 px-5",
            )}
          >
            {!collapsed ? (
              <>
                <span className="h-8 w-1.5 rounded-full bg-spark" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">Meta RH</p>
                  <Link href="/" className="block truncate text-sm font-semibold tracking-tight text-white">
                    {appConfig.name}
                  </Link>
                </div>
              </>
            ) : (
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"
                title={appConfig.name}
                aria-label={appConfig.name}
              >
                <span className="h-5 w-1.5 rounded-full bg-spark" aria-hidden />
              </Link>
            )}
          </div>
        </div>

        <nav className={cn("flex flex-1 flex-col gap-1 overflow-y-auto p-3", collapsed && "items-center")} aria-label="Principal">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  "flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors",
                  collapsed ? "w-11 justify-center px-0" : "gap-3 px-3 py-2.5",
                  active ? "bg-white text-accent shadow-sm" : "text-white/90 hover:bg-white/10",
                )}
              >
                <Icon icon={item.icon} className={cn("h-5 w-5", active ? "text-accent" : "text-white/90")} />
                {!collapsed ? (
                  <>
                    <span className="truncate">{item.label}</span>
                    {active ? <span className="ml-auto h-2 w-2 rounded-full bg-spark" aria-hidden /> : null}
                  </>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={cn("mt-auto border-t border-white/10 p-3", collapsed && "flex flex-col items-center")}>
          {!collapsed ? (
            <p className="mb-3 px-2 text-xs leading-relaxed text-white/50">Feito por e para pessoas</p>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium text-white/90 transition hover:bg-white/10",
              collapsed ? "w-11" : "w-full px-3",
            )}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expandir menu lateral" : "Minimizar menu lateral"}
            title={collapsed ? "Expandir" : "Minimizar"}
          >
            <Icon icon={collapsed ? PanelLeftOpen : PanelLeftClose} className="h-5 w-5" />
            {!collapsed ? <span>Minimizar</span> : null}
          </button>
        </div>
      </aside>

      {/* Espaço no fluxo para o conteúdo não ficar sob o menu fixo */}
      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 md:block",
          collapsed ? "w-[var(--sf-sidebar-collapsed-w)]" : "w-[var(--sf-sidebar-w)]",
        )}
        aria-hidden
      />
    </>
  );
}
