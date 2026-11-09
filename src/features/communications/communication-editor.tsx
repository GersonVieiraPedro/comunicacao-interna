"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, FileText, ImagePlus, Loader2, Megaphone, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { parseDateTimeLocalInput } from "@/lib/datetime";
import { composeDocument, parseDocument } from "@/features/communications/document-html";
import { RichDocumentEditor } from "@/features/communications/rich-document-editor";
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

function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function prepareFormData(
  form: HTMLFormElement,
  composedHtml: string,
  coverPath: string,
): FormData {
  const formData = new FormData(form);
  formData.set("bodyHtml", composedHtml);
  formData.set("coverPath", coverPath);

  for (const key of ["scheduledPublishAt", "expiresAt"] as const) {
    const raw = formData.get(key);
    if (typeof raw !== "string" || !raw.trim()) continue;
    try {
      formData.set(key, parseDateTimeLocalInput(raw).toISOString());
    } catch {
      // servidor valida
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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "schedule" | "publish" | null>(null);
  const [priority, setPriority] = useState(initial?.priority ?? CommunicationPriority.NORMAL);
  const [coverPath, setCoverPath] = useState(initial?.coverPath ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [advancedSource, setAdvancedSource] = useState(false);
  const parsed = useMemo(() => parseDocument(initial?.bodyHtml ?? "<p></p>"), [initial?.bodyHtml]);
  const [headerHtml, setHeaderHtml] = useState(parsed.headerHtml);
  const [bodyHtml, setBodyHtml] = useState(parsed.bodyHtml);
  const [footerHtml, setFooterHtml] = useState(parsed.footerHtml);
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
      const composed = advancedSource
        ? bodyHtml
        : composeDocument({ headerHtml, bodyHtml, footerHtml });
      const formData = prepareFormData(form, composed, coverPath);
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
          // best-effort
        }
      }
      if (kind === "schedule") {
        router.push("/admin/agenda");
      } else if (result.id) {
        router.push(`/admin/comunicados/${result.id}`);
      } else {
        router.push("/admin/comunicados");
      }
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

  async function onCoverSelected(file: File | undefined) {
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", "cover");
      const response = await fetch("/api/media/upload", { method: "POST", body });
      if (!response.ok) {
        setError("Não foi possível enviar a imagem de capa.");
        return;
      }
      const data = (await response.json()) as { path?: string };
      if (data.path) setCoverPath(data.path);
    } finally {
      setUploadingCover(false);
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
      <input type="hidden" name="priority" value={priority} />

      <Card className="flex flex-col gap-4 border-accent/15 bg-gradient-to-br from-surface to-accent-subtle/30">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon icon={Megaphone} className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-fg">Identidade do comunicado</h2>
            <p className="text-sm text-fg-muted">Título, resumo e capa usados no feed e nas notificações.</p>
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
          <p className="text-sm font-medium text-fg">Imagem de capa</p>
          {coverPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${coverPath}`}
              alt=""
              className="max-h-48 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-fg-muted">
              Sem capa
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
            >
              {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {coverPath ? "Trocar capa" : "Enviar capa"}
            </Button>
            {coverPath ? (
              <Button type="button" variant="ghost" onClick={() => setCoverPath("")}>
                Remover capa
              </Button>
            ) : null}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onCoverSelected(file);
            }}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-fg">
              <Icon icon={FileText} className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-fg">Painel de edição</h2>
              <p className="text-sm text-fg-muted">
                Cabeçalho, corpo e rodapé com formatação profissional para o time de comunicação.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-accent underline-offset-2 hover:underline"
            onClick={() => {
              if (advancedSource) {
                const next = parseDocument(bodyHtml);
                setHeaderHtml(next.headerHtml);
                setBodyHtml(next.bodyHtml);
                setFooterHtml(next.footerHtml);
                setAdvancedSource(false);
              } else {
                setBodyHtml(composeDocument({ headerHtml, bodyHtml, footerHtml }));
                setAdvancedSource(true);
              }
            }}
          >
            {advancedSource ? "Voltar ao painel visual" : "Editar HTML avançado"}
          </button>
        </div>

        {advancedSource ? (
          <textarea
            value={bodyHtml}
            onChange={(event) => setBodyHtml(event.target.value)}
            className="min-h-72 rounded-xl border border-border bg-surface px-3 py-2.5 font-mono text-[13px] leading-relaxed shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            spellCheck={false}
          />
        ) : (
          <RichDocumentEditor
            headerHtml={headerHtml}
            bodyHtml={bodyHtml}
            footerHtml={footerHtml}
            onChange={(next) => {
              setHeaderHtml(next.headerHtml);
              setBodyHtml(next.bodyHtml);
              setFooterHtml(next.footerHtml);
            }}
          />
        )}
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
              Agende no horário deste dispositivo. Itens agendados ficam na Agenda do admin para revisão.
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
            Este comunicado está na Agenda. Você pode remarcar, editar o conteúdo ou cancelar o agendamento.
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
