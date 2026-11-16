"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ActionBar, Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRetry() {
    if (pending) return;
    setPending(true);
    try {
      // Revalida JWT/sessão no servidor (casos comuns de cookie/token stale).
      await fetch("/api/auth/session", { cache: "no-store", credentials: "include" });
      router.refresh();
      reset();
    } catch {
      window.location.assign("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Não foi possível concluir a operação</h1>
      <p className="text-sm text-fg-muted">
        Muitas vezes é só a sessão desatualizada. Tente novamente para renovar e recarregar.
      </p>
      <ActionBar className="max-w-sm">
        <Button type="button" onClick={() => void handleRetry()} disabled={pending}>
          {pending ? "Atualizando…" : "Tentar novamente"}
        </Button>
        <ButtonLink href="/" variant="secondary">
          Tela inicial
        </ButtonLink>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          Sair do app
        </Button>
      </ActionBar>
    </main>
  );
}
