import type { ReactNode } from "react";

const tones = {
  info: "border-accent bg-accent-subtle text-fg",
  success: "border-success bg-green-50 text-fg",
  warning: "border-warning bg-amber-50 text-fg",
  danger: "border-danger bg-red-50 text-fg",
};

export function Alert({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children?: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <div role="status" className={`rounded border px-4 py-3 text-sm ${tones[tone]}`}>
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1 text-fg-muted">{children}</div> : null}
    </div>
  );
}
