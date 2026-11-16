import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LinkProps } from "next/link";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow",
  secondary: "border border-border bg-surface text-fg hover:bg-muted hover:border-accent/25",
  ghost: "border border-transparent text-fg hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 py-2.5 text-sm",
  sm: "min-h-9 px-4 py-2 text-sm",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold transition duration-150",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    block && "w-full",
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  block = false,
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, block, className })}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<LinkProps, "href"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  children?: ReactNode;
  target?: string;
  rel?: string;
};

/** Link com o mesmo visual do Button (CTAs externos/internos). */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block = false,
  className,
  children,
  target,
  rel,
  ...props
}: ButtonLinkProps) {
  const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  return (
    <Link
      href={href}
      target={target ?? (external && href.startsWith("http") ? "_blank" : undefined)}
      rel={rel ?? (external && href.startsWith("http") ? "noopener noreferrer" : undefined)}
      className={buttonClassName({ variant, size, block, className })}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Agrupa ações: coluna full-width no mobile (centralizado), linha no desktop. */
export function ActionBar({
  children,
  className,
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-stretch justify-center gap-2",
        "[&>button]:w-full [&>a]:w-full",
        "sm:flex-row sm:flex-wrap sm:items-center",
        "sm:[&>button]:w-auto sm:[&>a]:w-auto",
        align === "center" && "sm:justify-center",
        align === "start" && "sm:justify-start",
        align === "end" && "sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
