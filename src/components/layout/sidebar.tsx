import Link from "next/link";
import { Bell, History, Home, Megaphone, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { appConfig } from "@/config/app";
import { hasCommunicatorRole, type AppRole } from "@/types/roles";
import { Icon } from "@/components/ui/icon";

export function navItems(roles: AppRole[]): { href: string; label: string; icon: LucideIcon }[] {
  const items = [
    { href: "/", label: "Início", icon: Home },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/notificacoes", label: "Alertas", icon: Bell },
    { href: "/configuracoes", label: "Mais", icon: Settings },
  ];
  if (hasCommunicatorRole(roles)) {
    items.push({ href: "/admin", label: "Admin", icon: Megaphone });
  }
  return items;
}

export function Sidebar({ roles }: { roles: AppRole[] }) {
  return (
    <aside className="hidden w-[var(--sf-sidebar-w)] shrink-0 flex-col bg-accent text-white md:flex">
      <div className="flex h-[var(--sf-header-h)] items-center gap-3 border-b border-white/10 px-5">
        <span className="h-8 w-1.5 rounded-full bg-spark" aria-hidden />
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          {appConfig.name}
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-3" aria-label="Principal">
        {navItems(roles).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            <Icon icon={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="mt-auto px-5 pb-4 text-xs text-white/50">Feito por e para pessoas</p>
    </aside>
  );
}
