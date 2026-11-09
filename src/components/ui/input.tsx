import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ id, label, error, className, ...props }: Props) {
  const inputId = id ?? props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          "min-h-11 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-fg outline-none transition-shadow placeholder:text-fg-muted/80 focus:border-accent focus:bg-surface focus:shadow-sm",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
