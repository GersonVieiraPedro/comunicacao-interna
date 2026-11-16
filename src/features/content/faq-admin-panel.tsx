"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ActionBar, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  actionCreateFaq,
  actionCreateUsefulLink,
  actionDeleteFaq,
  actionDeleteUsefulLink,
  actionUpdateFaq,
  actionUpdateUsefulLink,
} from "@/features/content/actions";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
};

type LinkRow = {
  id: string;
  label: string;
  href: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

export function FaqAdminPanel({
  faqs,
  links,
}: {
  faqs: FaqRow[];
  links: LinkRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

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
      setEditingFaqId(null);
      setEditingLinkId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-fg">Gerenciar FAQ</h2>
          <p className="text-sm text-fg-muted">
            Perguntas e respostas visíveis para toda a base. Somente METARH edita.
          </p>
        </div>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            run(() => actionCreateFaq(formData), "Pergunta criada.");
            event.currentTarget.reset();
          }}
        >
          <Input name="question" label="Pergunta" required />
          <Textarea name="answer" label="Resposta" required />
          <Input name="sortOrder" label="Ordem (opcional)" type="number" min={0} />
          <ActionBar>
            <Button type="submit" disabled={pending}>
              Adicionar pergunta
            </Button>
          </ActionBar>
        </form>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {faqs.map((item) => {
            const editing = editingFaqId === item.id;
            return (
              <li key={item.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-fg">{item.question}</p>
                      <Badge tone={item.active ? "success" : "warning"}>
                        {item.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-fg-muted">{item.answer}</p>
                  </div>
                  <ActionBar className="w-full sm:w-auto" align="end">
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => setEditingFaqId(editing ? null : item.id)}
                    >
                      {editing ? "Fechar" : "Editar"}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={pending}
                      onClick={() =>
                        run(() => actionDeleteFaq(item.id), "Pergunta removida.")
                      }
                    >
                      Excluir
                    </Button>
                  </ActionBar>
                </div>
                {editing ? (
                  <form
                    className="grid gap-3 rounded-xl border border-border bg-bg p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      formData.set("id", item.id);
                      formData.set("active", formData.get("active") === "on" ? "true" : "false");
                      run(() => actionUpdateFaq(formData), "Pergunta atualizada.");
                    }}
                  >
                    <Input name="question" label="Pergunta" defaultValue={item.question} required />
                    <Textarea name="answer" label="Resposta" defaultValue={item.answer} required />
                    <Input
                      name="sortOrder"
                      label="Ordem"
                      type="number"
                      min={0}
                      defaultValue={item.sortOrder}
                    />
                    <label className="flex items-center gap-2 text-sm text-fg">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={item.active}
                        className="h-4 w-4 accent-[var(--sf-accent)]"
                      />
                      Visível na base
                    </label>
                    <ActionBar>
                      <Button type="submit" disabled={pending}>
                        Salvar
                      </Button>
                    </ActionBar>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-fg">Gerenciar links úteis</h2>
          <p className="text-sm text-fg-muted">
            Links exibidos na mesma página do FAQ para toda a base.
          </p>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            run(() => actionCreateUsefulLink(formData), "Link criado.");
            event.currentTarget.reset();
          }}
        >
          <Input name="label" label="Rótulo" required />
          <Input name="href" label="URL" required placeholder="https://..." />
          <Input name="description" label="Descrição (opcional)" className="sm:col-span-2" />
          <Input name="sortOrder" label="Ordem (opcional)" type="number" min={0} />
          <div className="sm:col-span-2">
            <ActionBar>
              <Button type="submit" disabled={pending}>
                Adicionar link
              </Button>
            </ActionBar>
          </div>
        </form>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {links.map((item) => {
            const editing = editingLinkId === item.id;
            return (
              <li key={item.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-fg">{item.label}</p>
                      <Badge tone={item.active ? "success" : "warning"}>
                        {item.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-accent">{item.href}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-fg-muted">{item.description}</p>
                    ) : null}
                  </div>
                  <ActionBar className="w-full sm:w-auto" align="end">
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => setEditingLinkId(editing ? null : item.id)}
                    >
                      {editing ? "Fechar" : "Editar"}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={pending}
                      onClick={() =>
                        run(() => actionDeleteUsefulLink(item.id), "Link removido.")
                      }
                    >
                      Excluir
                    </Button>
                  </ActionBar>
                </div>
                {editing ? (
                  <form
                    className="grid gap-3 rounded-xl border border-border bg-bg p-3 sm:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      formData.set("id", item.id);
                      formData.set("active", formData.get("active") === "on" ? "true" : "false");
                      run(() => actionUpdateUsefulLink(formData), "Link atualizado.");
                    }}
                  >
                    <Input name="label" label="Rótulo" defaultValue={item.label} required />
                    <Input name="href" label="URL" defaultValue={item.href} required />
                    <Input
                      name="description"
                      label="Descrição"
                      defaultValue={item.description ?? ""}
                      className="sm:col-span-2"
                    />
                    <Input
                      name="sortOrder"
                      label="Ordem"
                      type="number"
                      min={0}
                      defaultValue={item.sortOrder}
                    />
                    <label className="flex items-end gap-2 pb-2 text-sm text-fg">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={item.active}
                        className="h-4 w-4 accent-[var(--sf-accent)]"
                      />
                      Visível na base
                    </label>
                    <div className="sm:col-span-2">
                      <ActionBar>
                        <Button type="submit" disabled={pending}>
                          Salvar
                        </Button>
                      </ActionBar>
                    </div>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
