import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/** Placeholder com shimmer clássico de pré-carregamento. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl",
        "bg-[linear-gradient(90deg,var(--sf-surface-muted)_0%,#e4d7f2_45%,var(--sf-surface-muted)_90%)]",
        "bg-[length:200%_100%] animate-sf-shimmer",
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}
