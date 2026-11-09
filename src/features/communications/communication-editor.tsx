"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, FileText, Loader2, Megaphone, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { parseDateTimeLocalInput } from "@/lib/datetime";
import {
  actionCancel,
  actionCancelSchedule,
  actionPublish,
  actionSaveDraft,
  actionSchedule,
} from "@/features/communications/actions";
import { CommunicationPriority, CommunicationStatus } from "@/types/communication";

type Category = { id: string; name: string };

const PRIORITIES = [
  {
    value: CommunicationPriority.NORMAL,
    label: "Normal",
    hint: "Aparece no feed",
  },
  {
    value: CommunicationPriority.IMPORTANT,
    label: "Importante",
    hint: "Destaque + alerta",
  },
  {
    value: CommunicationPriority.URGENT,
    label: "Urgente",
    hint: "Popup e push forte",
  },
] as const;

function hasAdvancedHtml(html: string): boolean {
  return /<(ul|ol|li|a|img|h[1-6]|table|blockquote)\b/i.test(html);
}

function htmlToPlain(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function prepareFormData(form: HTMLFormElement, bodyValue: string, advancedHtml: boolean): FormData {
  const formData = new FormData(form);
  formData.set("bodyHtml", advancedHtml ? bodyValue : plainToHtml(bodyValue));

  for (const key of ["scheduledPublishAt", "expiresAt"] as const) {
    const raw = formData.get(key);
    if (typeof raw !== "string" || !raw.trim()) continue;
    try {
      formData.set(key, parseDateTimeLocalInput(raw).toISOString());
    } catch {
      // servidor valida e devolve mensagem clara
    }
  }
  return formData;
}

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
    scheduledPublishAt?: string | Date | null;
    expiresAt?: string | Date | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "schedule" | "publish" | null>(null);
  const [priority, setPriority] = useState(initial?.priority ?? CommunicationPriority.NORMAL);
  const [advancedHtml, setAdvancedHtml] = useState(() => hasAdvancedHtml(initial?.bodyHtml ?? ""));
  const [bodyValue, setBodyValue] = useState(() => {
    const html = initial?.bodyHtml ?? "";
    return hasAdvancedHtml(html) ? html : htmlToPlain(html);
  });
  const [scheduleHint, setScheduleHint] = useState<string | null>(null);

  const isScheduled = initial?.status === CommunicationStatus.SCHEDULED;

  const scheduleDefault = useMemo(
    () => toDateTimeLocalValue(initial?.scheduledPublishAt),
    [initial?.scheduledPublishAt],
  );
  const expiresDefault = useMemo(() => toDateTimeLocalValue(initial?.expiresAt), [initial?.expiresAt]);

  async function run(
    kind: "draft" | "schedule" | "publish",
    action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: string }>,
    form: HTMLFormElement,
    options?: { dispatchPush?: boolean },
  ) {
    setError(null);
    setBusy(kind);
    try {
      const formData = prepareFormData(form, bodyValue, advancedHtml);
      const result = await action(formData);
      if (!result.ok) {
        setError(result.message ?? "Não foi possível salvar.");
        return;
      }
      if (options?.dispatchPush && result.id) {
        try {
          await fetch("/api/push/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ communicationId: result.id }),
          });
        } catch {
          // publicação já ok; push é best-effort
        }
      }
      if (result.id) router.push(`/admin/comunicados/${result.id}`);
      else router.push("/admin/comunicados");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function onScheduleChange(value: string) {
    if (!value) {
      setScheduleHint(null);
      return;
    }
    try {
      const date = parseDateTimeLocalInput(value);
      const label = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(date);
      setScheduleHint(`Será publicado em ${label} (horário deste dispositivo).`);
    } catch {
      setScheduleHint(null);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
      {error ? (
        <Alert title="Não foi possível salvar" tone="danger">
          {error}
        </Alert>
      ) : null}

      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input type="hidden" name="coverPath" value={initial?.coverPath ?? ""} />
      <input type="hidden" name="priority" value={priority} />

      <Card className="flex flex-col gap-4 border-accent/15 bg-gradient-to-br from-surface to-accent-subtle/30">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon icon={Megaphone} className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-fg">Conteúdo</h2>
            <p className="text-sm text-fg-muted">Título claro, resumo curto e texto do comunicado.</p>
          </div>
        </div>
        <Input name="title" label="Título" defaultValue={initial?.title} required placeholder="Ex.: Atualização do benefício VR" />
        <Input
          name="subtitle"
          label="Subtítulo (opcional)"
          defaultValue={initial?.subtitle ?? ""}
          placeholder="Linha de apoio"
        />
        <Textarea
          name="summary"
          label="Resumo"
          defaultValue={initial?.summary}
          required
          placeholder="Uma ou duas frases para a notificação e o card do feed"
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-fg" htmlFor="body-editor">
              Texto do comunicado
            </label>
            <button
              type="button"
              className="text-xs font-medium text-accent underline-offset-2 hover:underline"
              onClick={() => {
                if (advancedHtml) {
                  setBodyValue(htmlToPlain(bodyValue));
                  setAdvancedHtml(false);
                } else {
                  setBodyValue(plainToHtml(bodyValue));
                  setAdvancedHtml(true);
                }
              }}
            >
              {advancedHtml ? "Usar editor simples" : "Editar HTML avançado"}
            </button>
          </div>
          <textarea
            id="body-editor"
            name="bodyHtml"
            value={bodyValue}
            onChange={(event) => setBodyValue(event.target.value)}
            className={cn(
              "min-h-52 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-fg shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
              advancedHtml && "font-mono text-[13px]",
            )}
            placeholder={
              advancedHtml
                ? "<p>Parágrafo com <strong>destaque</strong>...</p>"
                : "Escreva o comunicado. Use uma linha em branco para separar parágrafos."
            }
          />
          <p className="text-xs text-fg-muted">
            {advancedHtml
              ? "HTML simples (parágrafos, listas, links). Scripts são removidos no servidor."
              : "O texto vira parágrafos automaticamente na publicação."}
          </p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-fg">
            <Icon icon={FileText} className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-fg">Classificação</h2>
            <p className="text-sm text-fg-muted">Categoria e prioridade influenciam feed e alertas.</p>
          </div>
        </div>
        <Select name="categoryId" label="Categoria" defaultValue={initial?.categoryId ?? categories[0]?.id}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">Prioridade</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRIORITIES.map((item) => {
              const selected = priority === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPriority(item.value)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition",
                    selected
                      ? "border-accent bg-accent-subtle/60 shadow-sm"
                      : "border-border bg-surface hover:border-accent/30",
                  )}
                >
                  <span className="block text-sm font-semibold text-fg">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-fg-muted">{item.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-fg">
            <Icon icon={CalendarClock} className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-fg">Publicação</h2>
            <p className="text-sm text-fg-muted">
              Agende no horário deste dispositivo. Publicação automática ao abrir o app após o horário (e pelo job diário).
            </p>
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Agendar para
          <input
            type="datetime-local"
            name="scheduledPublishAt"
            defaultValue={scheduleDefault}
            onChange={(event) => onScheduleChange(event.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        {scheduleHint ? <p className="text-xs text-fg-muted">{scheduleHint}</p> : null}
        {isScheduled ? (
          <Alert title="Já agendado" tone="info">
            Este comunicado está aguardando a data marcada. Você pode remarcar ou cancelar o agendamento.
          </Alert>
        ) : null}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Expira em (opcional)
          <input
            type="datetime-local"
            name="expiresAt"
            defaultValue={expiresDefault}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </Card>

      <div className="sticky bottom-16 z-10 -mx-1 flex flex-col gap-2 rounded-2xl border border-border/80 bg-surface/95 p-3 shadow-lg backdrop-blur md:bottom-3 md:flex-row md:items-center">
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={(event) => {
            const form = (event.currentTarget as HTMLButtonElement).form;
            if (form) void run("draft", actionSaveDraft, form);
          }}
        >
          {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar rascunho
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={(event) => {
            const form = (event.currentTarget as HTMLButtonElement).form;
            if (form) void run("schedule", actionSchedule, form);
          }}
        >
          {busy === "schedule" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
          Agendar
        </Button>
        <Button
          type="button"
          disabled={busy !== null}
          onClick={(event) => {
            const form = (event.currentTarget as HTMLButtonElement).form;
            if (form) void run("publish", actionPublish, form, { dispatchPush: true });
          }}
        >
          {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publicar agora
        </Button>
        {isScheduled && initial ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy !== null}
            onClick={() => void actionCancelSchedule(initial.id).then(() => router.refresh())}
          >
            Cancelar agendamento
          </Button>
        ) : null}
        {initial && initial.status !== CommunicationStatus.PUBLISHED ? (
          <Button
            type="button"
            variant="danger"
            disabled={busy !== null}
            onClick={() => void actionCancel(initial.id).then(() => router.push("/admin/comunicados"))}
          >
            Cancelar comunicado
          </Button>
        ) : null}
      </div>
    </form>
  );
}
