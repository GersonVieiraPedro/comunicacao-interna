"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { urlBase64ToUint8Array } from "@/components/pwa/push-prompt";

export function PushSettings() {
  const [permission, setPermission] = useState<string>("unknown");
  const [support, setSupport] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as { standalone?: boolean }).standalone);
    if (!("Notification" in window) || !("PushManager" in window)) {
      setSupport(
        iOS && !standalone
          ? "iOS: instale o PWA (Adicionar à Tela de Início) para notificações. Sem instalação, o Safari não concede Web Push."
          : "Web Push não está disponível neste navegador.",
      );
    } else if (iOS && !standalone) {
      setSupport("No iPhone/iPad, abra a Central instalada na Tela de Início para ativar notificações.");
    }
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  async function enable() {
    setStatus("");
    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);
    if (permissionResult !== "granted") {
      setStatus("Permissão não concedida. Se o navegador bloqueou, use as configurações do sistema.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("Chave VAPID pública ausente neste ambiente.");
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
    setStatus(response.ok ? "Dispositivo registrado para avisos." : "Falha ao salvar a subscription.");
  }

  return (
    <Card>
      <p className="font-medium">Notificações push</p>
      <p className="mt-1 text-sm text-fg-muted">Estado da permissão: {permission}</p>
      {support ? <p className="mt-2 text-sm">{support}</p> : null}
      <div className="mt-3">
        <Button onClick={enable} disabled={Boolean(support) && !("PushManager" in window)}>
          Ativar neste dispositivo
        </Button>
      </div>
      {status ? <p className="mt-2 text-sm">{status}</p> : null}
      <p className="mt-3 text-xs text-fg-muted">
        Android Chrome/Edge e desktop Chromium costumam funcionar. iOS exige PWA instalado (16.4+). Não afirmamos
        entrega se o sistema operacional recusar.
      </p>
    </Card>
  );
}
