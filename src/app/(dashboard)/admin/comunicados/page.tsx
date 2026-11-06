import { auth } from "@/auth";
import { getAdminList, categoriesForUi } from "@/services/communication-service";
import { adminQuerySchema } from "@/validations/communication";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CommunicationStatus } from "@/types/communication";

const statusLabel: Record<string, string> = {
  [CommunicationStatus.DRAFT]: "Rascunho",
  [CommunicationStatus.SCHEDULED]: "Agendado",
  [CommunicationStatus.PUBLISHED]: "Publicado",
  [CommunicationStatus.EXPIRED]: "Expirado",
  [CommunicationStatus.CANCELLED]: "Cancelado",
};

export default async function AdminListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const raw = await searchParams;
  const parsed = adminQuerySchema.parse({
    status: typeof raw.status === "string" && raw.status ? raw.status : undefined,
    categoryId: typeof raw.categoryId === "string" && raw.categoryId ? raw.categoryId : undefined,
    priority: typeof raw.priority === "string" && raw.priority ? raw.priority : undefined,
    page: raw.page,
  });
  const [result, categories] = await Promise.all([
    getAdminList(session?.user, parsed),
    categoriesForUi(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Comunicados"
        actions={
          <Link
            href="/admin/comunicados/novo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Novo
          </Link>
        }
      />
      <form className="flex flex-col gap-3 md:flex-row">
        <select name="status" defaultValue={parsed.status ?? ""} className="rounded border border-border px-3 py-2 text-sm">
          <option value="">Status</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="categoryId" defaultValue={parsed.categoryId ?? ""} className="rounded border border-border px-3 py-2 text-sm">
          <option value="">Categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border border-border px-3 py-2 text-sm">
          Filtrar
        </button>
      </form>
      <Table>
        <THead>
          <tr>
            <TH>Título</TH>
            <TH>Categoria</TH>
            <TH>Status</TH>
            <TH>Prioridade</TH>
            <TH>Visualizações</TH>
          </tr>
        </THead>
        <TBody>
          {result.items.map((item) => (
            <tr key={item.id}>
              <TD>
                <Link href={`/admin/comunicados/${item.id}`} className="text-accent hover:underline">
                  {item.title}
                </Link>
              </TD>
              <TD>{item.category.name}</TD>
              <TD>
                <Badge>{statusLabel[item.status] ?? item.status}</Badge>
              </TD>
              <TD>{item.priority}</TD>
              <TD>{item._count.reads}</TD>
            </tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
