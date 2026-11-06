import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function Icon({
  icon: Glyph,
  className,
  label,
}: {
  icon: LucideIcon;
  className?: string;
  label?: string;
}) {
  return (
    <Glyph
      className={cn("h-4 w-4 shrink-0", className)}
      strokeWidth={1.75}
      aria-hidden={!label}
      aria-label={label}
    />
  );
}
