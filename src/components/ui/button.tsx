import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow",
  secondary: "border border-border bg-surface text-fg hover:bg-muted hover:border-accent/20",
  ghost: "text-fg hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children?: ReactNode }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
