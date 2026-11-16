"use client";

import { ActionBar, Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Não foi possível concluir a operação</h1>
      <p className="text-sm text-fg-muted">Tente novamente. Se o problema persistir, contate o suporte.</p>
      <ActionBar className="max-w-xs">
        <Button type="button" onClick={reset}>
          Tentar novamente
        </Button>
      </ActionBar>
    </main>
  );
}
