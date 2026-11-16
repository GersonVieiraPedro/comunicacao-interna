import { auth } from "@/auth";
import { getAdminList, categoriesForUi } from "@/services/communication-service";
import { adminQuerySchema } from "@/validations/communication";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionBar, Button, ButtonLink } from "@/components/ui/button";
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
          <>
            <ButtonLink href="/admin/agenda" variant="secondary">
              Agenda
            </ButtonLink>
            <ButtonLink href="/admin/comunicados/novo">Novo</ButtonLink>
          </>
        }
      />
      <form className="flex flex-col gap-3 md:flex-row md:items-center">
        <select name="status" defaultValue={parsed.status ?? ""} className="min-h-11 rounded-full border border-border bg-surface px-4 text-sm">
          <option value="">Status</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="categoryId" defaultValue={parsed.categoryId ?? ""} className="min-h-11 rounded-full border border-border bg-surface px-4 text-sm">
          <option value="">Categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <ActionBar className="md:w-auto" align="start">
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </ActionBar>
      </form>
      <Table>
        <THead>
          <tr>
            <TH>Título</TH>
            <TH>Categoria</TH>
            <TH>Status</TH>
            <TH>Agendado para</TH>
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
              <TD>
                {item.scheduledPublishAt
                  ? new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Sao_Paulo",
                    }).format(item.scheduledPublishAt)
                  : "—"}
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
