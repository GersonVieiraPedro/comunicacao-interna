"use client";

import Link from "next/link";
import { actionMarkNotification } from "@/features/communications/actions";
import { CommunicationPriority } from "@/types/communication";

export function NotificationList({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    body: string;
    readAt: Date | null;
    openedAt: Date | null;
    communication: { id: string; title: string; priority: string };
  }>;
}) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/comunicados/${item.communication.id}`} className="font-medium text-accent">
              {item.communication.title}
            </Link>
            <div className="flex shrink-0 items-center gap-2 text-xs text-fg-muted">
              {item.openedAt ? <span>Visualizada</span> : <span>Não aberta</span>}
              {!item.readAt ? (
                <button
                  type="button"
                  className="underline"
                  onClick={() => void actionMarkNotification(item.id)}
                >
                  Marcar tratada
                </button>
              ) : (
                <span>Tratada</span>
              )}
            </div>
          </div>
          <p className="text-sm text-fg-muted">{item.body}</p>
          {item.communication.priority === CommunicationPriority.URGENT ? (
            <p className="text-xs text-danger">Urgente</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
