"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Dropdown({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="rounded border border-border bg-surface px-3 py-2 text-sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-20 mt-1 min-w-40 rounded border border-border bg-surface py-1 shadow",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
