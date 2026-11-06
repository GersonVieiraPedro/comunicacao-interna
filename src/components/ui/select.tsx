import { cn } from "@/lib/cn";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ id, label, error, className, children, ...props }: Props) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-fg">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        className={cn(
          "rounded border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent",
          error && "border-danger",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
