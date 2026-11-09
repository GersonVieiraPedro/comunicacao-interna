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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
