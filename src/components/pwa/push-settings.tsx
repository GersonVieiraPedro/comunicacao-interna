"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { readLocalPushState, registerPushSubscription } from "@/lib/push-client";

type UiState = "loading" | "unsupported" | "blocked" | "inactive" | "active";

export function PushSettings({ canBroadcastTest = false }: { canBroadcastTest?: boolean }) {
  const [ui, setUi] = useState<UiState>("loading");
  const [support, setSupport] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const state = await readLocalPushState();
    setSupport(state.support ?? "");
    if (state.support && state.permission === "unsupported") {
      setUi("unsupported");
      return;
    }
    if (state.support) {
      setUi("unsupported");
      return;
    }
    if (state.permission === "denied") {
      setUi("blocked");
      return;
    }
    setUi(state.subscribed && state.permission === "granted" ? "active" : "inactive");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enable() {
    setStatus("");
    setBusy(true);
    try {
      const result = await registerPushSubscription();
      if (!result.ok) {
        setStatus(result.message);
        await refresh();
        return;
      }
      setStatus("Notificações ativadas neste aparelho.");
      setUi("active");
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
          setStatus("Chaves VAPID inválidas no servidor. Ajuste WEB_PUSH_* na Vercel e faça Redeploy.");
        } else if (reason === "NO_SUBSCRIPTIONS") {
          setStatus("Nenhum dispositivo registrado. Ative as notificações em cada aparelho primeiro.");
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

  const active = ui === "active";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0",
        active ? "border-success/30 ring-1 ring-success/15" : "border-border/80",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-4 px-5 py-5",
          active ? "bg-gradient-to-r from-success/10 to-accent-subtle/40" : "bg-accent-subtle/30",
        )}
      >
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            active ? "bg-success text-white shadow-sm" : "bg-white text-accent shadow-sm",
          )}
          aria-hidden
        >
          {ui === "loading" ? (
            <Icon icon={Loader2} className="h-6 w-6 animate-spin" />
          ) : active ? (
            <Icon icon={BellRing} className="h-6 w-6" />
          ) : ui === "blocked" || ui === "unsupported" ? (
            <Icon icon={BellOff} className="h-6 w-6" />
          ) : (
            <Icon icon={Bell} className="h-6 w-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-fg">Notificações push</p>
            {active ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
                <Icon icon={CheckCircle2} className="h-3.5 w-3.5" />
                Ativas neste aparelho
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-fg-muted">
                {ui === "blocked" ? "Bloqueadas" : ui === "unsupported" ? "Indisponíveis" : "Desativadas"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            {active
              ? "Este dispositivo vai receber avisos quando um comunicado for publicado."
              : ui === "blocked"
                ? "O sistema bloqueou as notificações. Libere nas configurações do aparelho/site e ative de novo."
                : ui === "unsupported"
                  ? support || "Web Push não está disponível neste contexto."
                  : "Ative para receber alertas com som neste aparelho."}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        {support && ui === "unsupported" ? <p className="text-sm text-fg-muted">{support}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {ui !== "unsupported" ? (
            <Button onClick={() => void enable()} disabled={busy || ui === "blocked"}>
              {busy ? (
                <>
                  <Icon icon={Loader2} className="h-4 w-4 animate-spin" />
                  Ativando…
                </>
              ) : active ? (
                <>
                  <Icon icon={BellRing} className="h-4 w-4" />
                  Reativar / atualizar
                </>
              ) : (
                <>
                  <Icon icon={Bell} className="h-4 w-4" />
                  Ativar neste dispositivo
                </>
              )}
            </Button>
          ) : null}
          {canBroadcastTest ? (
            <Button variant="secondary" onClick={() => void sendTest()} disabled={busy}>
              Enviar notificação de teste
            </Button>
          ) : null}
        </div>

        {status ? (
          <p
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              active && status.includes("ativadas")
                ? "bg-success/10 text-success"
                : status.toLowerCase().includes("falha") ||
                    status.toLowerCase().includes("inválid") ||
                    status.toLowerCase().includes("bloque")
                  ? "bg-red-50 text-danger"
                  : "bg-muted text-fg",
            )}
            role="status"
          >
            {status}
          </p>
        ) : null}

        <p className="text-xs text-fg-muted">
          {canBroadcastTest
            ? 'O teste envia "Notificação Teste" para todos os dispositivos registrados.'
            : "Depois de ativar, você pode minimizar o app — o aviso aparece mesmo fora da tela."}{" "}
          No iPhone use sempre o ícone da Tela de Início.
        </p>
      </div>
    </Card>
  );
}
