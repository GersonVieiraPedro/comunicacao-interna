import { auth } from "@/auth";
import { getHistory, categoriesForUi } from "@/services/communication-service";
import { CommunicationCard } from "@/features/communications/communication-card";
import { historyQuerySchema } from "@/validations/communication";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Inbox } from "lucide-react";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const raw = await searchParams;
  const parsed = historyQuerySchema.parse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    categoryId: typeof raw.categoryId === "string" && raw.categoryId ? raw.categoryId : undefined,
    from: typeof raw.from === "string" && raw.from ? raw.from : undefined,
    to: typeof raw.to === "string" && raw.to ? raw.to : undefined,
    unreadOnly: raw.unreadOnly === "1" || raw.unreadOnly === "true",
    page: raw.page,
  });
  const now = new Date();
  const [result, categories] = await Promise.all([
    getHistory(session?.user, {
      ...parsed,
      userId: session!.user.id,
      now,
    }),
    categoriesForUi(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title="Histórico" description="Comunicados publicados e expirados." />
      <form className="grid gap-3 rounded-lg border border-border bg-surface p-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Busca
          <input name="q" defaultValue={parsed.q} className="rounded border border-border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Categoria
          <select name="categoryId" defaultValue={parsed.categoryId ?? ""} className="rounded border border-border px-3 py-2">
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          De
          <input type="date" name="from" defaultValue={raw.from?.toString() ?? ""} className="rounded border border-border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Até
          <input type="date" name="to" defaultValue={raw.to?.toString() ?? ""} className="rounded border border-border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="unreadOnly" value="1" defaultChecked={parsed.unreadOnly} />
          Somente não visualizados
        </label>
        <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-white">
          Filtrar
        </button>
      </form>
      {result.items.length === 0 ? (
        <EmptyState title="Nada encontrado" description="Ajuste a busca ou os filtros." icon={Inbox} />
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((item) => (
            <CommunicationCard
              key={item.id}
              id={item.id}
              title={item.title}
              summary={item.summary}
              category={item.category.name}
              publishedAt={item.publishedAt}
              unread={item.reads.length === 0}
              priority={item.priority}
              coverUrl={item.coverPath ? `/api/media/${item.coverPath}` : null}
            />
          ))}
        </div>
      )}
      <p className="text-sm text-fg-muted">
        Página {parsed.page} · {result.total} item(ns)
      </p>
      {parsed.page > 1 ? (
        <Link className="text-sm text-accent underline" href={`/historico?page=${parsed.page - 1}`}>
          Anterior
        </Link>
      ) : null}
    </div>
  );
}
