import { auth } from "@/auth";
import { getAdminDashboard } from "@/services/communication-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CommunicationStatus } from "@/types/communication";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Plus } from "lucide-react";

export default async function AdminHomePage() {
  const session = await auth();
  const data = await getAdminDashboard(session?.user);

  const cards = [
    { label: "Total", value: data.total },
    { label: "Publicados", value: data.counts[CommunicationStatus.PUBLISHED] ?? 0 },
    { label: "Rascunhos", value: data.counts[CommunicationStatus.DRAFT] ?? 0 },
    { label: "Agendados", value: data.counts[CommunicationStatus.SCHEDULED] ?? 0 },
    { label: "Colaboradores", value: data.eligible },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administração"
        description="Publicação e leitura dos comunicados."
        actions={
          <Link
            href="/admin/comunicados/novo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            <Icon icon={Plus} />
            Novo comunicado
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-sm text-fg-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </Card>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Menor taxa de visualização</h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {data.lowest.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link href={`/admin/comunicados/${item.id}`} className="text-accent hover:underline">
                {item.title}
              </Link>
              <span>
                {item.readCount} · {item.percent}%
              </span>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/admin/comunicados" className="text-sm text-accent underline">
        Ver todos os comunicados
      </Link>
    </div>
  );
}
