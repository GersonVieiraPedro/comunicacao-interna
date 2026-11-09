import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Bell } from "lucide-react";

export function NotificationBellLink({ count }: { count: number }) {
  return (
    <Link
      href="/notificacoes"
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-sm text-accent transition-colors hover:bg-accent-subtle"
      aria-label={count ? `${count} notificações não lidas` : "Notificações"}
    >
      <Icon icon={Bell} className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute right-1 top-1 inline-flex min-w-4 rounded-full bg-danger px-1 text-[10px] text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
