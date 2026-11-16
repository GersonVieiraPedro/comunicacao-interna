"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ActionBar, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  actionCreateUser,
  actionToggleUserActive,
  actionUpdateUser,
} from "@/features/users/actions";
import { AppRole, hasMetarhRole, resolveEffectiveRole } from "@/types/roles";

type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  active: boolean;
  roles: string[];
  pushDevices: number;
  contractStatus?: string | null;
  contractType?: string | null;
  economicGroup?: string | null;
  cnpj?: string | null;
  healthPlan?: string | null;
  reimbursementCard?: string | null;
  clientOrgId?: string | null;
};

function profileLabel(user: ManagedUser) {
  const role = resolveEffectiveRole({
    roles: user.roles as never,
    contractStatus: user.contractStatus,
  });
  if (role === AppRole.METARH || hasMetarhRole(user.roles as never)) return "METARH";
  if (role === AppRole.CLIENT) return "Cliente";
  if (role === AppRole.CANDIDATE) return "Candidato";
  return "Colaborador";
}

function defaultProfileRole(user?: ManagedUser) {
  if (!user) return AppRole.COLLABORATOR;
  if (hasMetarhRole(user.roles as never)) return AppRole.METARH;
  if (user.roles.includes(AppRole.CLIENT)) return AppRole.CLIENT;
  if (user.roles.includes(AppRole.CANDIDATE)) return AppRole.CANDIDATE;
  return AppRole.COLLABORATOR;
}

function HrFields({ user }: { user?: ManagedUser }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm text-fg">
        <span>Status do contrato</span>
        <select
          name="contractStatus"
          defaultValue={user?.contractStatus ?? "ACTIVE"}
          className="min-h-11 rounded-xl border border-border bg-surface px-3"
        >
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
          <option value="NONE">Sem contrato</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-fg">
        <span>Tipo de contrato</span>
        <select
          name="contractType"
          defaultValue={user?.contractType ?? ""}
          className="min-h-11 rounded-xl border border-border bg-surface px-3"
        >
          <option value="">—</option>
          <option value="TEMPORARY">Temporário</option>
          <option value="THIRD_PARTY">Terceiro</option>
        </select>
      </label>
      <Input name="economicGroup" label="Grupo econômico" defaultValue={user?.economicGroup ?? ""} />
      <Input name="cnpj" label="CNPJ" defaultValue={user?.cnpj ?? ""} />
      <Input name="healthPlan" label="Plano de saúde" defaultValue={user?.healthPlan ?? ""} />
      <Input
        name="reimbursementCard"
        label="Cartão de reembolso"
        defaultValue={user?.reimbursementCard ?? ""}
      />
      <Input
        name="clientOrgId"
        label="ID organização cliente"
        defaultValue={user?.clientOrgId ?? ""}
        className="sm:col-span-2"
      />
    </>
  );
}

export function UserAdminPanel({
  users,
  pushEnabledCount = 0,
}: {
  users: ManagedUser[];
  pushEnabledCount?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; message?: string }>, success: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message ?? "Não foi possível salvar.");
        return;
      }
      setMessage(success);
      setEditingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <p className="text-sm text-fg-muted">Push Web ativo</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {pushEnabledCount}
          <span className="ml-2 text-sm font-medium text-fg-muted">
            de {users.filter((user) => user.active).length} ativos nesta lista
          </span>
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-fg">Novo usuário</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            run(() => actionCreateUser(formData), "Usuário criado.");
            event.currentTarget.reset();
          }}
        >
          <Input name="displayName" label="Nome" required autoComplete="name" />
          <Input name="email" label="E-mail" type="email" required autoComplete="email" />
          <Input
            name="password"
            label="Senha inicial"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <label className="flex flex-col gap-1 text-sm text-fg">
            <span>Perfil</span>
            <select
              name="profileRole"
              defaultValue={AppRole.COLLABORATOR}
              className="min-h-11 rounded-xl border border-border bg-surface px-3"
            >
              <option value={AppRole.METARH}>METARH</option>
              <option value={AppRole.CLIENT}>Cliente</option>
              <option value={AppRole.COLLABORATOR}>Colaborador</option>
              <option value={AppRole.CANDIDATE}>Candidato</option>
            </select>
          </label>
          <HrFields />
          <div className="sm:col-span-2">
            <ActionBar>
              <Button type="submit" disabled={pending}>
                Cadastrar
              </Button>
            </ActionBar>
          </div>
        </form>
      </Card>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {users.map((user) => {
          const editing = editingId === user.id;
          return (
            <li key={user.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-fg">{user.displayName}</p>
                    <Badge tone={user.active ? "success" : "warning"}>
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge tone="info">{profileLabel(user)}</Badge>
                    <Badge tone={user.pushDevices > 0 ? "success" : "neutral"}>
                      {user.pushDevices > 0 ? `Push · ${user.pushDevices} disp.` : "Sem push"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-fg-muted">{user.email}</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    {[user.contractType, user.economicGroup, user.cnpj].filter(Boolean).join(" · ") ||
                      "Sem atributos de contrato"}
                  </p>
                </div>
                <ActionBar className="w-full sm:w-auto" align="end">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingId(editing ? null : user.id)}
                    disabled={pending}
                  >
                    {editing ? "Fechar" : "Editar"}
                  </Button>
                  <Button
                    variant={user.active ? "danger" : "secondary"}
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => actionToggleUserActive(user.id, !user.active),
                        user.active ? "Usuário desativado." : "Usuário reativado.",
                      )
                    }
                  >
                    {user.active ? "Desativar" : "Reativar"}
                  </Button>
                </ActionBar>
              </div>

              {editing ? (
                <form
                  className="mt-4 grid gap-3 rounded-xl border border-border bg-bg p-4 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    formData.set("id", user.id);
                    formData.set("active", String(user.active));
                    run(() => actionUpdateUser(formData), "Usuário atualizado.");
                  }}
                >
                  <Input name="displayName" label="Nome" defaultValue={user.displayName} required />
                  <Input
                    name="password"
                    label="Nova senha (opcional)"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Deixe em branco para manter"
                  />
                  <label className="flex flex-col gap-1 text-sm text-fg sm:col-span-2">
                    <span>Perfil</span>
                    <select
                      name="profileRole"
                      defaultValue={defaultProfileRole(user)}
                      className="min-h-11 rounded-xl border border-border bg-surface px-3"
                    >
                      <option value={AppRole.METARH}>METARH</option>
                      <option value={AppRole.CLIENT}>Cliente</option>
                      <option value={AppRole.COLLABORATOR}>Colaborador</option>
                      <option value={AppRole.CANDIDATE}>Candidato</option>
                    </select>
                  </label>
                  <HrFields user={user} />
                  <div className="sm:col-span-2">
                    <ActionBar>
                      <Button type="submit" disabled={pending}>
                        Salvar alterações
                      </Button>
                    </ActionBar>
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
