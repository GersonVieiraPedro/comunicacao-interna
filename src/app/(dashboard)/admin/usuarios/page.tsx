import Link from "next/link";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ActionBar, Button, ButtonLink } from "@/components/ui/button";
import { UserAdminPanel } from "@/features/users/user-admin-panel";
import { listManagedUsers } from "@/services/user-service";
import { listUsersQuerySchema } from "@/validations/user";
import { AppRole, ContractType } from "@/types/roles";

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function usersHref(params: Record<string, string | number | undefined>, page: number) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === "all") continue;
    if (key === "page" || key === "pageSize") continue;
    sp.set(key, String(value));
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/admin/usuarios?${qs}` : "/admin/usuarios";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const raw = await searchParams;

  // Compat: push=1 antigo → push=yes
  const pushRaw = first(raw.push);
  const pushNormalized = pushRaw === "1" ? "yes" : pushRaw;

  const query = listUsersQuerySchema.parse({
    q: first(raw.q),
    page: first(raw.page),
    pageSize: first(raw.pageSize),
    status: first(raw.status),
    role: first(raw.role),
    push: pushNormalized,
    source: first(raw.source),
    contractType: first(raw.contractType),
  });

  const result = await listManagedUsers(session?.user, {
    q: query.q || undefined,
    page: query.page,
    pageSize: query.pageSize,
    status: query.status,
    role: query.role === "all" ? "all" : (query.role as AppRole),
    push: query.push,
    source: query.source,
    contractType: query.contractType,
  });

  const users = result.items.map((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    active: user.active,
    roles: user.roles.map((role) => role.role),
    pushDevices: user._count.pushSubscriptions,
    codigoFuncionario: user.codigoFuncionario,
    mustChangePassword: user.mustChangePassword,
    lastSyncedAt: user.lastSyncedAt,
    contractStatus: user.contractStatus,
    contractType: user.contractType,
    economicGroup: user.economicGroup,
    cnpj: user.cnpj,
    healthPlan: user.healthPlan,
    reimbursementCard: user.reimbursementCard,
    clientOrgId: user.clientOrgId,
  }));

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filterState = {
    q: query.q || undefined,
    status: query.status,
    role: query.role,
    push: query.push,
    source: query.source,
    contractType: query.contractType,
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Sync ERP diário + gestão de senha, papéis e push. Lista paginada no servidor."
      />

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3"
        action="/admin/usuarios"
        method="get"
      >
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Nome, e-mail ou código ERP…"
          className="min-h-11 rounded-full border border-border bg-bg px-4 text-sm outline-none focus:border-accent sm:col-span-2 lg:col-span-3"
          aria-label="Buscar usuários"
        />
        <label className="flex flex-col gap-1 text-sm text-fg">
          <span>Status</span>
          <select
            name="status"
            defaultValue={query.status}
            className="min-h-11 rounded-full border border-border bg-bg px-4 text-sm"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-fg">
          <span>Perfil</span>
          <select
            name="role"
            defaultValue={query.role}
            className="min-h-11 rounded-full border border-border bg-bg px-4 text-sm"
          >
            <option value="all">Todos</option>
            <option value={AppRole.METARH}>METARH</option>
            <option value={AppRole.COLLABORATOR}>Colaborador</option>
            <option value={AppRole.CANDIDATE}>Candidato</option>
            <option value={AppRole.CLIENT}>Cliente</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-fg">
          <span>Push</span>
          <select
            name="push"
            defaultValue={query.push}
            className="min-h-11 rounded-full border border-border bg-bg px-4 text-sm"
          >
            <option value="all">Todos</option>
            <option value="yes">Com push</option>
            <option value="no">Sem push</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-fg">
          <span>Origem</span>
          <select
            name="source"
            defaultValue={query.source}
            className="min-h-11 rounded-full border border-border bg-bg px-4 text-sm"
          >
            <option value="all">Todas</option>
            <option value="erp">ERP (sync)</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-fg">
          <span>Tipo de contrato</span>
          <select
            name="contractType"
            defaultValue={query.contractType}
            className="min-h-11 rounded-full border border-border bg-bg px-4 text-sm"
          >
            <option value="all">Todos</option>
            <option value={ContractType.TEMPORARY}>Temporário</option>
            <option value={ContractType.THIRD_PARTY}>Terceiro</option>
            <option value="none">Sem tipo</option>
          </select>
        </label>
        <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-1">
          <ActionBar align="start">
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
            <ButtonLink href="/admin/usuarios" variant="ghost">
              Limpar
            </ButtonLink>
          </ActionBar>
        </div>
      </form>

      <UserAdminPanel
        users={users}
        pushEnabledCount={result.pushEnabledCount}
        activeCount={result.activeCount}
        filteredTotal={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />

      <nav
        className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        aria-label="Paginação de usuários"
      >
        <p className="text-center text-fg-muted sm:text-left">
          {result.total === 0
            ? "Nenhum usuário neste filtro"
            : `Página ${result.page} de ${totalPages} · ${result.total} resultado${result.total === 1 ? "" : "s"}`}
        </p>
        <ActionBar className="sm:w-auto" align="end">
          {result.page > 1 ? (
            <ButtonLink href={usersHref(filterState, result.page - 1)} variant="secondary">
              Anterior
            </ButtonLink>
          ) : (
            <Button variant="secondary" disabled>
              Anterior
            </Button>
          )}
          {result.page < totalPages ? (
            <ButtonLink href={usersHref(filterState, result.page + 1)} variant="secondary">
              Próxima
            </ButtonLink>
          ) : (
            <Button variant="secondary" disabled>
              Próxima
            </Button>
          )}
        </ActionBar>
      </nav>

      {query.q || query.status !== "all" || query.role !== "all" ? (
        <p className="text-xs text-fg-muted">
          Dica: a busca por código ERP aceita só números (ex.: <Link className="underline" href={usersHref({ q: "12345" }, 1)}>12345</Link>).
        </p>
      ) : null}
    </div>
  );
}
