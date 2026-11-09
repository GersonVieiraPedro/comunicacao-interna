"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  actionCreateUser,
  actionToggleUserActive,
  actionUpdateUser,
} from "@/features/users/actions";
import { AppRole } from "@/types/roles";

type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  active: boolean;
  roles: string[];
};

export function UserAdminPanel({ users }: { users: ManagedUser[] }) {
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
        <h2 className="text-sm font-semibold text-fg">Novo usuário</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Cadastro com e-mail e senha. O colaborador acessa imediatamente após o login.
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
          <label className="flex min-h-11 items-end gap-2 pb-2 text-sm text-fg">
            <input type="checkbox" name="roleCommunicator" className="h-4 w-4 accent-[var(--sf-accent)]" />
            Também é comunicador (admin)
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              Cadastrar
            </Button>
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
          const isCommunicator = user.roles.includes(AppRole.COMMUNICATOR);
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
                    <Badge tone={isCommunicator ? "info" : "neutral"}>
                      {isCommunicator ? "Comunicador" : "Colaborador"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-fg-muted">{user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                </div>
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
                  <Input
                    name="displayName"
                    label="Nome"
                    defaultValue={user.displayName}
                    required
                  />
                  <Input
                    name="password"
                    label="Nova senha (opcional)"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Deixe em branco para manter"
                  />
                  <label className="flex min-h-11 items-end gap-2 pb-2 text-sm text-fg sm:col-span-2">
                    <input
                      type="checkbox"
                      name="roleCommunicator"
                      defaultChecked={isCommunicator}
                      className="h-4 w-4 accent-[var(--sf-accent)]"
                    />
                    Papel de comunicador
                  </label>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={pending}>
                      Salvar alterações
                    </Button>
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
