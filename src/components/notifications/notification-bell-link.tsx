"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

export function NotificationBellLink({ count }: { count: number }) {
  const pathname = usePathname();
  const active = pathname === "/notificacoes" || pathname.startsWith("/notificacoes/");

  return (
    <Link
      href="/notificacoes"
      className={cn(
        "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-sm transition-colors",
        active
          ? "bg-accent-subtle text-accent ring-1 ring-accent/25"
          : "text-accent hover:bg-accent-subtle",
      )}
      aria-label={count ? `${count} notificações não lidas` : "Notificações"}
      aria-current={active ? "page" : undefined}
    >
      <Icon icon={Bell} className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute right-1 top-1 inline-flex min-w-4 justify-center rounded-full bg-danger p-1 text-[10px] font-semibold leading-none text-white">
          <span>{count > 9 ? "9+" : count}</span>
        </span>
      ) : null}
    </Link>
  );
}
