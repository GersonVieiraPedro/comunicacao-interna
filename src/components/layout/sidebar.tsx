"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  CalendarClock,
  CircleHelp,
  FileText,
  History,
  Home,
  LayoutDashboard,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { appConfig } from "@/config/app";
import {
  AppRole,
  hasMetarhRole,
  resolveEffectiveRole,
  type AppRole as Role,
} from "@/types/roles";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "sf-sidebar-collapsed";

type NavItem = { href: string; label: string; icon: LucideIcon };

function effectiveProfile(roles: Role[], effectiveRole?: Role): Role {
  return (
    effectiveRole ??
    resolveEffectiveRole({
      roles,
      contractStatus: roles.includes(AppRole.CANDIDATE) ? "NONE" : "ACTIVE",
    })
  );
}

/** Ordem de consumo (mobile-first). */
export function navItems(roles: Role[], effectiveRole?: Role): NavItem[] {
  const profile = effectiveProfile(roles, effectiveRole);

  if (profile === AppRole.CANDIDATE) {
    return [
      { href: "/", label: "Início", icon: Home },
      { href: "/vagas", label: "Vagas", icon: Briefcase },
      { href: "/configuracoes", label: "Mais", icon: Settings },
    ];
  }

  if (profile === AppRole.CLIENT) {
    return [
      { href: "/", label: "Início", icon: Home },
      { href: "/historico", label: "Histórico", icon: History },
      { href: "/contato-cs", label: "CS", icon: MessageCircle },
      { href: "/pesquisas", label: "Pesquisas", icon: CircleHelp },
      { href: "/configuracoes", label: "Mais", icon: Settings },
    ];
  }

  // Colaborador / METARH (consumo)
  const items: NavItem[] = [
    { href: "/", label: "Início", icon: Home },
    { href: "/notificacoes", label: "Alertas", icon: Bell },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/faq", label: "FAQ", icon: CircleHelp },
    { href: "/configuracoes", label: "Mais", icon: Settings },
  ];

  if (hasMetarhRole(roles) || profile === AppRole.METARH) {
    items.push(
      { href: "/admin", label: "Painel", icon: LayoutDashboard },
      { href: "/admin/comunicados", label: "Comunicados", icon: FileText },
      { href: "/admin/agenda", label: "Agenda", icon: CalendarClock },
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
    );
  }

  return items;
}

/** Bottom nav PWA: no máximo 4 atalhos. Alertas ficam só no header (sino). */
export function mobileNavItems(roles: Role[], effectiveRole?: Role): NavItem[] {
  const profile = effectiveProfile(roles, effectiveRole);

  if (profile === AppRole.CANDIDATE) {
    return [
      { href: "/", label: "Início", icon: Home },
      { href: "/vagas", label: "Vagas", icon: Briefcase },
      { href: "/faq", label: "FAQ", icon: CircleHelp },
      { href: "/configuracoes", label: "Mais", icon: Settings },
    ];
  }

  if (profile === AppRole.CLIENT) {
    return [
      { href: "/", label: "Início", icon: Home },
      { href: "/contato-cs", label: "CS", icon: MessageCircle },
      { href: "/faq", label: "FAQ", icon: CircleHelp },
      { href: "/configuracoes", label: "Mais", icon: Settings },
    ];
  }

  if (hasMetarhRole(roles) || profile === AppRole.METARH) {
    return [
      { href: "/", label: "Início", icon: Home },
      { href: "/admin/comunicados", label: "Comunicados", icon: FileText },
      { href: "/faq", label: "FAQ", icon: CircleHelp },
      { href: "/configuracoes", label: "Mais", icon: Settings },
    ];
  }

  return [
    { href: "/", label: "Início", icon: Home },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/faq", label: "FAQ", icon: CircleHelp },
    { href: "/configuracoes", label: "Mais", icon: Settings },
  ];
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

export function Sidebar({
  roles,
  effectiveRole,
}: {
  roles: Role[];
  effectiveRole?: Role;
}) {
  const pathname = usePathname();
  const items = navItems(roles, effectiveRole);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
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

  const consumerCount =
    hasMetarhRole(roles) || effectiveProfile(roles, effectiveRole) === AppRole.METARH
      ? items.length - 4
      : items.length;
  const consumerItems = items.slice(0, consumerCount);
  const adminItems = items.slice(consumerCount);

  const itemClass = (active?: boolean) =>
    cn(
      "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      active ? "bg-white text-accent shadow-sm" : "text-white/90 hover:bg-white/10",
    );

  function renderItem(item: NavItem) {
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
  }

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden overflow-hidden bg-accent text-white transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex md:flex-col",
          collapsed ? "w-[var(--sf-sidebar-collapsed-w)]" : "w-[var(--sf-sidebar-w)]",
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
          {consumerItems.map(renderItem)}
          {adminItems.length > 0 ? (
            <>
              <div
                className={cn(
                  "my-2 overflow-hidden px-3 transition-[max-height,opacity]",
                  collapsed ? "max-h-0 opacity-0" : "max-h-8 opacity-100",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                  Administração
                </p>
              </div>
              {collapsed ? <div className="my-1 border-t border-white/10" aria-hidden /> : null}
              {adminItems.map(renderItem)}
            </>
          ) : null}
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
