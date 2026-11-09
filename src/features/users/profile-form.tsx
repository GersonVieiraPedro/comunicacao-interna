"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { actionUpdateProfile } from "@/features/users/actions";

export function ProfileForm({
  displayName,
  email,
  hasPassword,
}: {
  displayName: string;
  email: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <h2 className="text-sm font-semibold text-fg">Perfil</h2>
      <p className="mt-1 text-sm text-fg-muted">Atualize seu nome e, se usar senha local, a senha de acesso.</p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await actionUpdateProfile(formData);
            if (!result.ok) {
              setError(result.message ?? "Não foi possível salvar.");
              return;
            }
            setMessage("Perfil atualizado.");
            event.currentTarget.reset();
            router.refresh();
          });
        }}
      >
        <Input name="displayName" label="Nome exibido" defaultValue={displayName} required />
        <Input label="E-mail" value={email} disabled readOnly />
        {hasPassword ? (
          <>
            <Input
              name="currentPassword"
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              placeholder="Obrigatória só para trocar a senha"
            />
            <Input
              name="newPassword"
              label="Nova senha"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="Deixe em branco para manter"
            />
          </>
        ) : (
          <p className="text-sm text-fg-muted">Esta conta não usa senha local (SSO / desenvolvimento).</p>
        )}
        {message ? <p className="text-sm text-success">{message}</p> : null}
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={pending}>
            Salvar perfil
          </Button>
        </div>
      </form>
    </Card>
  );
}
