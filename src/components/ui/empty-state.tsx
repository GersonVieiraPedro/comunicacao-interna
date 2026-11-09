import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/80 px-6 py-14 text-center shadow-sm">
      {icon ? (
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent">
          <Icon icon={icon} className="h-6 w-6" />
        </span>
      ) : null}
      <p className="text-base font-semibold text-fg">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">{description}</p>
      ) : null}
    </div>
  );
}
