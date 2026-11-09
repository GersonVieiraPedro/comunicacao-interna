"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarClock,
  FileText,
  History,
  Home,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
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
    items.push({ href: "/admin", label: "Painel", icon: LayoutDashboard });
    items.push({ href: "/admin/comunicados", label: "Comunicados", icon: FileText });
    items.push({ href: "/admin/agenda", label: "Agenda", icon: CalendarClock });
    items.push({ href: "/admin/usuarios", label: "Usuários", icon: Users });
  }
  return items;
}

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/comunicados") {
    return pathname === "/admin/comunicados" || pathname.startsWith("/admin/comunicados/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] ease-out",
        collapsed
          ? "ml-0 max-w-0 opacity-0 duration-150"
          : "ml-0 max-w-[11rem] opacity-100 duration-300 delay-75",
      )}
      aria-hidden={collapsed}
    >
      {children}
    </span>
  );
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

  const itemClass = (active?: boolean) =>
    cn(
      "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      active ? "bg-white text-accent shadow-sm" : "text-white/90 hover:bg-white/10",
    );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden overflow-hidden bg-accent text-white transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex md:flex-col",
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
          <div className="relative flex h-[var(--sf-header-h)] items-center gap-3 overflow-hidden border-b border-white/10 px-3.5">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10"
              title={appConfig.name}
              aria-label={appConfig.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-metarh-branco.png" alt="" className="h-6 w-auto" />
            </Link>
            <div
              className={cn(
                "min-w-0 overflow-hidden transition-[max-width,opacity] ease-out",
                collapsed
                  ? "max-w-0 opacity-0 duration-150"
                  : "max-w-[12rem] opacity-100 duration-300 delay-75",
              )}
            >
              <p className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
                METARH
              </p>
              <p className="truncate text-sm font-semibold tracking-tight text-white">{appConfig.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-3" aria-label="Principal">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={itemClass(active)}
              >
                <Icon icon={item.icon} className={cn("h-5 w-5 shrink-0", active ? "text-accent" : "text-white/90")} />
                <SidebarLabel collapsed={collapsed}>
                  <span className="inline-flex w-[11rem] items-center gap-2">
                    <span className="truncate">{item.label}</span>
                    {active ? <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-spark" aria-hidden /> : null}
                  </span>
                </SidebarLabel>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={itemClass(false)}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expandir menu lateral" : "Minimizar menu lateral"}
            title={collapsed ? "Expandir" : "Minimizar"}
          >
            <Icon
              icon={collapsed ? PanelLeftOpen : PanelLeftClose}
              className="h-5 w-5 shrink-0 text-white/90"
            />
            <SidebarLabel collapsed={collapsed}>
              <span className="inline-block w-[11rem] truncate">Minimizar</span>
            </SidebarLabel>
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:block",
          collapsed ? "w-[var(--sf-sidebar-collapsed-w)]" : "w-[var(--sf-sidebar-w)]",
        )}
        aria-hidden
      />
    </>
  );
}
