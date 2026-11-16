import type { ReactNode } from "react";
import { ActionBar } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 text-center sm:text-left">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-fg md:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted sm:mx-0 mx-auto">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <ActionBar className="sm:w-auto" align="end">
          {actions}
        </ActionBar>
      ) : null}
    </div>
  );
}
