"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { actionAcknowledge } from "@/features/communications/actions";

export function AcknowledgeBar({
  communicationId,
  acknowledged,
}: {
  communicationId: string;
  acknowledged: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(acknowledged);

  if (done) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-fg">
        Ciência confirmada. Obrigado por confirmar a leitura.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent-subtle/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-fg">Confirmar ciência</p>
        <p className="mt-0.5 text-sm text-fg-muted">
          Já registramos que você abriu este comunicado. Use o botão só para confirmar que leu e está ciente.
        </p>
      </div>
      <Button
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await actionAcknowledge(communicationId);
            if (result.ok) {
              setDone(true);
              router.refresh();
            }
          });
        }}
      >
        Marcar como lido
      </Button>
    </div>
  );
}
