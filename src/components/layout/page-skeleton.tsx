import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton padrão mobile-first para troca de telas no dashboard. */
export function PageSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>

      <div className="space-y-2.5">
        <Skeleton className="h-2.5 w-14" />
        <Skeleton className="h-8 w-52 max-w-[70%]" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <Skeleton className="h-32 w-full rounded-2xl" />

      <div className="space-y-3.5">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="overflow-hidden rounded-2xl border border-border/60 bg-surface/70 p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-3 w-[60%]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
