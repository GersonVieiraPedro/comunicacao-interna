"use client";

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
      <button type="button" className="rounded bg-accent px-3 py-2 text-sm text-white" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
