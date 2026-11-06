"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { classifyPwaInstall, isIosDevice, isStandaloneDisplay, type PwaInstallKind } from "@/lib/pwa-install";

const DISMISS_KEY = "cci-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function currentKind(canPrompt: boolean): PwaInstallKind {
  return classifyPwaInstall({
    standalone: isStandaloneDisplay(),
    ios: isIosDevice(),
    canPrompt,
    hasServiceWorker: "serviceWorker" in navigator,
  });
}

export function InstallAppCard({ variant = "banner" }: { variant?: "banner" | "settings" }) {
  const [kind, setKind] = useState<PwaInstallKind | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(variant === "banner" && localStorage.getItem(DISMISS_KEY) === "1");
    setKind(currentKind(false));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      const installEvent = event as BeforeInstallPromptEvent;
      setDeferred(installEvent);
      setKind(currentKind(true));
    };
    const onInstalled = () => {
      setDeferred(null);
      setKind("installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [variant]);

  async function install() {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setKind(isStandaloneDisplay() ? "installed" : currentKind(false));
    } finally {
      setBusy(false);
    }
  }

  if (!kind || kind === "unsupported") return null;
  if (kind === "installed") {
    if (variant === "banner") return null;
    return (
      <Card>
        <p className="font-medium">Aplicativo</p>
        <p className="mt-1 text-sm text-fg-muted">A Central já está aberta como aplicativo neste aparelho.</p>
      </Card>
    );
  }
  if (variant === "banner" && dismissed) return null;

  if (kind === "one-tap") {
    return (
      <Card>
        <p className="font-medium">Usar como aplicativo</p>
        <p className="mt-1 text-sm text-fg-muted">
          Um toque: ícone na tela inicial, tela cheia, sem a barra do navegador.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={install} disabled={busy} className="min-h-11">
            <Download className="h-4 w-4" aria-hidden />
            Instalar a Central
          </Button>
          {variant === "banner" ? (
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, "1");
                setDismissed(true);
              }}
            >
              Agora não
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="font-medium">Usar como aplicativo</p>
      <p className="mt-1 text-sm text-fg-muted">
        No iPhone a Apple não deixa o site instalar com um único botão. São dois toques no Safari:
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
        <li>Compartilhar (quadrado com a seta para cima).</li>
        <li>Adicionar à Tela de Início.</li>
      </ol>
      {variant === "banner" ? (
        <Button
          variant="ghost"
          className="mt-2"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
        >
          Já entendi
        </Button>
      ) : null}
    </Card>
  );
}
