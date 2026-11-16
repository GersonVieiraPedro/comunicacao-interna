import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ActionBar, Button } from "@/components/ui/button";
import { UserAdminPanel } from "@/features/users/user-admin-panel";
import { listManagedUsers } from "@/services/user-service";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; push?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const pushOnly = params.push === "1";
  const users = await listManagedUsers(session?.user, params.q);
  const withPushMeta = users.map((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    active: user.active,
    roles: user.roles.map((role) => role.role),
    pushDevices: user._count.pushSubscriptions,
    contractStatus: user.contractStatus,
    contractType: user.contractType,
    economicGroup: user.economicGroup,
    cnpj: user.cnpj,
    healthPlan: user.healthPlan,
    reimbursementCard: user.reimbursementCard,
    clientOrgId: user.clientOrgId,
  }));
  const visible = pushOnly ? withPushMeta.filter((user) => user.pushDevices > 0) : withPushMeta;
  const pushEnabledCount = withPushMeta.filter((user) => user.active && user.pushDevices > 0).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Cadastro, acesso, papéis e quem tem push do navegador ativo."
      />
      <form className="flex flex-col gap-3 sm:flex-row sm:items-center" action="/admin/usuarios" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Buscar por nome ou e-mail…"
          className="min-h-11 flex-1 rounded-full border border-border bg-bg px-4 text-sm outline-none focus:border-accent"
        />
        <label className="inline-flex min-h-11 items-center justify-center gap-2 text-sm text-fg sm:justify-start">
          <input
            type="checkbox"
            name="push"
            value="1"
            defaultChecked={pushOnly}
            className="h-4 w-4 accent-[var(--sf-accent)]"
          />
          Só com push
        </label>
        <ActionBar className="sm:w-auto" align="start">
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </ActionBar>
      </form>
      <UserAdminPanel users={visible} pushEnabledCount={pushEnabledCount} />
    </div>
  );
}
