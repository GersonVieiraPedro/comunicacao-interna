"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { mobileNavItems } from "@/components/layout/sidebar";
import type { AppRole } from "@/types/roles";

export function BottomNav({
  roles,
  effectiveRole,
}: {
  roles: AppRole[];
  effectiveRole?: AppRole;
}) {
  const pathname = usePathname();
  const items = mobileNavItems(roles, effectiveRole);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface shadow-[0_-8px_24px_rgba(71,0,130,0.06)] md:hidden"
      aria-label="Navegação inferior"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-lg">
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
                "relative flex h-[var(--sf-bottom-nav-h)] flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors",
                active ? "text-accent" : "text-fg-muted hover:text-fg",
              )}
            >
              {active ? (
                <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-spark" aria-hidden />
              ) : null}
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  active && "bg-accent-subtle",
                )}
              >
                <Icon icon={item.icon} className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* Preenche o espaço do overscroll elástico (iOS/Android) abaixo da barra. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full h-[100dvh] bg-surface"
      />
    </nav>
  );
}
