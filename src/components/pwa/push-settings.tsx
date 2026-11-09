"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { urlBase64ToUint8Array } from "@/components/pwa/push-prompt";

export function PushSettings({ canBroadcastTest = false }: { canBroadcastTest?: boolean }) {
  const [permission, setPermission] = useState<string>("unknown");
  const [support, setSupport] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
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
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setStatus("");
    setBusy(true);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        reason?: string;
        sent?: number;
        failed?: number;
      };
      if (response.status === 403) {
        setStatus("Apenas administradores/comunicadores podem enviar o teste.");
        return;
      }
      if (!response.ok || !data.ok) {
        const reason = data.reason ?? "Falha";
        if (reason === "VAPID_NOT_CONFIGURED" || reason === "VAPID_INVALID") {
          setStatus(
            "Chaves VAPID inválidas na Vercel. Confira WEB_PUSH_* (sem aspas) e NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY, depois faça Redeploy.",
          );
        } else if (reason === "NO_SUBSCRIPTIONS") {
          setStatus("Nenhum dispositivo registrado. Peça para cada usuário ativar as notificações.");
        } else {
          setStatus(`Não foi possível enviar o teste (${reason}).`);
        }
        return;
      }
      setStatus(
        `Notificação Teste enviada para ${data.sent ?? 0} dispositivo(s)${
          data.failed ? ` (${data.failed} falha(s))` : ""
        }.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <p className="font-medium">Notificações push</p>
      <p className="mt-1 text-sm text-fg-muted">Estado da permissão: {permission}</p>
      {support ? <p className="mt-2 text-sm">{support}</p> : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => void enable()} disabled={busy || (Boolean(support) && !("PushManager" in window))}>
          Ativar neste dispositivo
        </Button>
        {canBroadcastTest ? (
          <Button variant="secondary" onClick={() => void sendTest()} disabled={busy}>
            Enviar notificação de teste
          </Button>
        ) : null}
      </div>
      {status ? <p className="mt-2 text-sm">{status}</p> : null}
      <p className="mt-3 text-xs text-fg-muted">
        {canBroadcastTest
          ? 'O botão de teste envia "Notificação Teste" para todos os dispositivos registrados.'
          : "Ative neste aparelho para receber avisos quando um comunicado for publicado."}{" "}
        No iPhone use o app na Tela de Início.
      </p>
    </Card>
  );
}
