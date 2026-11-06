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
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      {icon ? (
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-accent">
          <Icon icon={icon} className="h-5 w-5" />
        </span>
      ) : null}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
    </div>
  );
}
