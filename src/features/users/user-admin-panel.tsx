"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ActionBar, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  actionCreateUser,
  actionResetUserPassword,
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
  codigoFuncionario?: number | null;
  mustChangePassword?: boolean;
  lastSyncedAt?: Date | string | null;
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

function isErpSynced(user?: ManagedUser) {
  return user?.codigoFuncionario != null;
}

function HrFields({ user, readOnly }: { user?: ManagedUser; readOnly?: boolean }) {
  if (readOnly && user) {
    return (
      <div className="sm:col-span-2 grid gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium text-fg">Dados RH (ERP — somente leitura)</p>
        <p className="text-fg-muted">
          Status: {user.contractStatus ?? "—"} · Tipo: {user.contractType ?? "—"}
        </p>
        <p className="text-fg-muted">Grupo: {user.economicGroup ?? "—"}</p>
        <p className="text-fg-muted">
          CNPJ: {user.cnpj ?? "—"} · Cliente: {user.clientOrgId ?? "—"}
        </p>
        <p className="text-fg-muted">
          Plano: {user.healthPlan ?? "—"} · Reembolso: {user.reimbursementCard ?? "—"}
        </p>
      </div>
    );
  }

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
  activeCount = 0,
  filteredTotal = 0,
  page = 1,
  pageSize = 25,
}: {
  users: ManagedUser[];
  pushEnabledCount?: number;
  activeCount?: number;
  filteredTotal?: number;
  page?: number;
  pageSize?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const rangeFrom = filteredTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, filteredTotal);

  function run(action: () => Promise<{ ok: boolean; message?: string }>, success: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message ?? "Não foi possível salvar.");
        return;
      }
      setMessage(result.message ?? success);
      setEditingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-fg-muted">Neste filtro</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{filteredTotal}</p>
          <p className="mt-1 text-xs text-fg-muted">
            Exibindo {rangeFrom}–{rangeTo}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-fg-muted">Ativos (base)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-fg-muted">Push Web ativo</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {pushEnabledCount}
            <span className="ml-2 text-sm font-medium text-fg-muted">de {activeCount} ativos</span>
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-fg">Novo usuário (manual)</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Colaboradores do ERP entram pelo sync diário. Use isto para CLIENT/METARH ou exceções.
        </p>
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

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center">
          <p className="font-medium text-fg">Nenhum usuário encontrado</p>
          <p className="mt-1 text-sm text-fg-muted">
            Ajuste a busca ou os filtros. A lista é paginada no servidor (não carrega os 5 mil de uma vez).
          </p>
        </div>
      ) : null}

      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {users.map((user) => {
          const editing = editingId === user.id;
          const synced = isErpSynced(user);
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
                    {synced ? (
                      <Badge tone="neutral">{`ERP #${user.codigoFuncionario}`}</Badge>
                    ) : null}
                    {user.mustChangePassword ? (
                      <Badge tone="warning">Trocar senha</Badge>
                    ) : null}
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
                  {synced ? (
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => actionResetUserPassword(user.id),
                          "Senha resetada para o padrão temporário.",
                        )
                      }
                    >
                      Resetar senha
                    </Button>
                  ) : null}
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
                  {synced ? (
                    <>
                      <input type="hidden" name="displayName" value={user.displayName} />
                      <Input label="Nome (ERP)" defaultValue={user.displayName} disabled />
                    </>
                  ) : (
                    <Input
                      name="displayName"
                      label="Nome"
                      defaultValue={user.displayName}
                      required
                    />
                  )}
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
                  <HrFields user={user} readOnly={synced} />
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
