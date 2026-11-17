"use client";

import { useActionState } from "react";
import { ActionBar, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { actionChangePassword } from "@/features/users/actions";

type State = { ok: false; message?: string } | null;

async function submit(_prev: State, formData: FormData): Promise<State> {
  const result = await actionChangePassword(formData);
  if (!result.ok) return { ok: false, message: result.message };
  return null;
}

export function ChangePasswordForm({ forced }: { forced?: boolean }) {
  const [state, formAction, pending] = useActionState(submit, null);

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="text-lg font-semibold text-fg">
        {forced ? "Troque sua senha temporária" : "Trocar senha"}
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        {forced
          ? "No primeiro acesso use a senha temporária informada pela METARH e defina uma nova (mín. 8 caracteres, com letra e número)."
          : "Informe a senha atual e a nova senha desejada."}
      </p>
      <form action={formAction} className="mt-5 space-y-3">
        <Input
          name="currentPassword"
          type="password"
          label="Senha atual"
          autoComplete="current-password"
          required
        />
        <Input
          name="newPassword"
          type="password"
          label="Nova senha"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <Input
          name="confirmPassword"
          type="password"
          label="Confirmar nova senha"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state?.message ? (
          <p className="text-sm text-danger" role="alert">
            {state.message}
          </p>
        ) : null}
        <ActionBar>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar nova senha"}
          </Button>
        </ActionBar>
      </form>
    </Card>
  );
}
