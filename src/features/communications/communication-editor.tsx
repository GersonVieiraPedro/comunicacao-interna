"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { actionCancel, actionCancelSchedule, actionPublish, actionSaveDraft, actionSchedule } from "@/features/communications/actions";
import { CommunicationPriority, CommunicationStatus } from "@/types/communication";

type Category = { id: string; name: string };

export function CommunicationEditor({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: {
    id: string;
    title: string;
    subtitle: string | null;
    summary: string;
    bodyHtml: string;
    categoryId: string;
    priority: string;
    status: string;
    coverPath: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml ?? "<p></p>");

  async function run(action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: string }>, formData: FormData) {
    setError(null);
    const result = await action(formData);
    if (!result.ok) {
      setError(result.message ?? "Não foi possível salvar.");
      return;
    }
    if (result.id) router.push(`/admin/comunicados/${result.id}`);
    else router.push("/admin/comunicados");
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => event.preventDefault()}
    >
      {error ? (
        <Alert title="Não foi possível salvar" tone="danger">
          {error}
        </Alert>
      ) : null}
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input type="hidden" name="coverPath" value={initial?.coverPath ?? ""} />
      <Input name="title" label="Título" defaultValue={initial?.title} required />
      <Input name="subtitle" label="Subtítulo" defaultValue={initial?.subtitle ?? ""} />
      <Textarea name="summary" label="Resumo" defaultValue={initial?.summary} required />
      <Select name="categoryId" label="Categoria" defaultValue={initial?.categoryId ?? categories[0]?.id}>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select name="priority" label="Prioridade" defaultValue={initial?.priority ?? CommunicationPriority.NORMAL}>
        <option value={CommunicationPriority.NORMAL}>Normal</option>
        <option value={CommunicationPriority.IMPORTANT}>Importante</option>
        <option value={CommunicationPriority.URGENT}>Urgente</option>
      </Select>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Conteúdo
        <textarea
          name="bodyHtml"
          value={bodyHtml}
          onChange={(event) => setBodyHtml(event.target.value)}
          className="min-h-48 rounded border border-border px-3 py-2 font-mono text-sm"
          aria-describedby="html-help"
        />
        <span id="html-help" className="font-normal text-fg-muted">
          HTML simples (parágrafos, listas, links, imagens). Scripts são removidos no servidor.
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Expira em (opcional)
        <input type="datetime-local" name="expiresAt" className="rounded border border-border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Agendar para
        <input type="datetime-local" name="scheduledPublishAt" className="rounded border border-border px-3 py-2" />
      </label>
      <div className="sticky bottom-16 flex flex-col gap-2 bg-bg py-3 md:bottom-0 md:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={(event) => {
            const form = (event.currentTarget as HTMLButtonElement).form;
            if (form) void run(actionSaveDraft, new FormData(form));
          }}
        >
          Salvar rascunho
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={(event) => {
            const form = (event.currentTarget as HTMLButtonElement).form;
            if (form) void run(actionSchedule, new FormData(form));
          }}
        >
          Agendar
        </Button>
        <Button
          type="button"
          onClick={(event) => {
            const form = (event.currentTarget as HTMLButtonElement).form;
            if (form) void run(actionPublish, new FormData(form));
          }}
        >
          Publicar
        </Button>
        {initial?.status === CommunicationStatus.SCHEDULED ? (
          <Button type="button" variant="ghost" onClick={() => void actionCancelSchedule(initial.id).then(() => router.refresh())}>
            Cancelar agendamento
          </Button>
        ) : null}
        {initial && initial.status !== CommunicationStatus.PUBLISHED ? (
          <Button type="button" variant="danger" onClick={() => void actionCancel(initial.id).then(() => router.push("/admin/comunicados"))}>
            Cancelar comunicado
          </Button>
        ) : null}
      </div>
    </form>
  );
}
