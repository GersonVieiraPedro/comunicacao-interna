"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { actionAcknowledge } from "@/features/communications/actions";
import { CommunicationPriority } from "@/types/communication";

export function UnreadCommunicationModal({
  communication,
}: {
  communication: {
    id: string;
    title: string;
    summary: string;
    priority: string;
    categoryName: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  async function onUnderstand() {
    await actionAcknowledge(communication.id);
    setOpen(false);
    router.refresh();
  }

  return (
    <Modal open={open} title="Novo comunicado" onClose={() => setOpen(false)}>
      <div className="flex flex-wrap gap-2">
        <Badge tone="info">{communication.categoryName}</Badge>
        {communication.priority === CommunicationPriority.URGENT ? <Badge tone="danger">Urgente</Badge> : null}
        {communication.priority === CommunicationPriority.IMPORTANT ? (
          <Badge tone="warning">Importante</Badge>
        ) : null}
      </div>
      <h3 className="mt-3 text-base font-semibold">{communication.title}</h3>
      <p className="mt-2 text-sm text-fg-muted">{communication.summary}</p>
      <p className="mt-3 text-xs text-fg-muted">
        Abrir registra que você viu. “Marcar como lido” confirma ciência.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Ver depois
        </Button>
        <Button variant="secondary" onClick={() => router.push(`/comunicados/${communication.id}`)}>
          Abrir
        </Button>
        <Button onClick={onUnderstand}>Marcar como lido</Button>
      </div>
    </Modal>
  );
}
