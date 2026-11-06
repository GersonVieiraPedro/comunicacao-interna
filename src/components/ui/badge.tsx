import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-muted text-fg",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-warning",
  danger: "bg-red-50 text-danger",
  info: "bg-accent-subtle text-accent",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={cn("inline-flex rounded-sm px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
