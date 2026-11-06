"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "cci-push-prompt-dismissed";

function supportMessage() {
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (iOS && !standalone) {
      return "No iPhone, instale a Central na Tela de Início (Compartilhar → Adicionar à Tela de Início) para poder ativar notificações. Safari sem instalação não recebe Web Push.";
    }
    return "Este navegador não oferece Web Push. No Android, use Chrome ou Edge. No iOS, é necessário o PWA instalado (iOS 16.4+).";
  }
  return null;
}

export function PushPrompt() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const blocked = localStorage.getItem(DISMISS_KEY);
    const unsupported = supportMessage();
    setMessage(unsupported);
    if (!blocked && !unsupported && Notification.permission === "default") {
      setOpen(true);
    }
  }, []);

  async function enable() {
    setError(null);
    const unsupported = supportMessage();
    if (unsupported) {
      setMessage(unsupported);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      localStorage.setItem(DISMISS_KEY, "1");
      setOpen(false);
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError("Notificações push não estão configuradas neste ambiente (chave VAPID pública ausente).");
      return;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const response = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) {
      setError("Não foi possível registrar este dispositivo.");
      return;
    }
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="mb-4">
      <Alert title="Quer receber avisos importantes da Central de Comunicação?" tone="info">
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={enable}>Ativar notificações</Button>
          <Button
            variant="secondary"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setOpen(false);
            }}
          >
            Agora não
          </Button>
        </div>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Alert>
    </div>
  );
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}
