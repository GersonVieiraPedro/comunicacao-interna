import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { UserAdminPanel } from "@/features/users/user-admin-panel";
import { listManagedUsers } from "@/services/user-service";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const users = await listManagedUsers(session?.user, params.q);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Cadastro, acesso e papéis dos colaboradores da central."
      />
      <form className="flex gap-2" action="/admin/usuarios" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Buscar por nome ou e-mail…"
          className="min-h-11 flex-1 rounded-xl border border-border bg-bg px-3.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-5 text-sm font-semibold hover:bg-muted"
        >
          Buscar
        </button>
      </form>
      <UserAdminPanel
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          active: user.active,
          roles: user.roles.map((role) => role.role),
        }))}
      />
    </div>
  );
}
