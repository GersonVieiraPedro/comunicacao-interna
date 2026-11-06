import { cn } from "@/lib/cn";
import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function Textarea({ id, label, error, className, ...props }: Props) {
  const areaId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={areaId} className="text-sm font-medium text-fg">
        {label}
      </label>
      <textarea
        id={areaId}
        className={cn(
          "min-h-24 rounded border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
