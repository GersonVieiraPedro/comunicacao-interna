"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { pushSupportMessage, registerPushSubscription } from "@/lib/push-client";

const DISMISS_KEY = "cci-push-prompt-dismissed";

export function PushPrompt() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const blocked = localStorage.getItem(DISMISS_KEY);
    const unsupported = pushSupportMessage();
    setMessage(unsupported);
    if (!blocked && !unsupported && Notification.permission === "default") {
      setOpen(true);
    }
  }, []);

  async function enable() {
    setError(null);
    setBusy(true);
    try {
      const result = await registerPushSubscription();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      localStorage.setItem(DISMISS_KEY, "1");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="mb-2">
      <Alert title="Quer receber avisos importantes da Central?" tone="info">
        <p className="mt-1 text-sm text-fg-muted">
          Ative as notificações para saber na hora quando um comunicado for publicado.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void enable()} disabled={busy}>
            <Icon icon={Bell} className="h-4 w-4" />
            {busy ? "Ativando…" : "Ativar notificações"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setOpen(false);
            }}
          >
            Agora não
          </Button>
        </div>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
        {error ? (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </Alert>
    </div>
  );
}

export { urlBase64ToUint8Array } from "@/lib/push-client";
