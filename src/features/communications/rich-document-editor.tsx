"use client";

import { useCallback, useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ALargeSmall,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";
import { FontSize } from "@/features/communications/font-size";
import { Icon } from "@/components/ui/icon";
import { MediaLimitsHint } from "@/components/media/media-limits-hint";
import { prepareImageUpload } from "@/lib/prepare-image-upload";
import { IMAGE_LIMITS } from "@/lib/image-limits";
import { cn } from "@/lib/cn";

const FONT_SIZES = [
  { label: "Pequeno", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Grande", value: "18px" },
  { label: "Título", value: "22px" },
  { label: "Destaque", value: "28px" },
];

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-fg transition",
        active ? "border-accent/30 bg-accent-subtle text-accent" : "hover:bg-muted",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function EditorToolbar({
  editor,
  fileInputRef,
  onPickImage,
}: {
  editor: Editor;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPickImage: (file: File | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-muted/40 px-2 py-2 [scrollbar-width:thin]">
      <ToolbarButton
        label="Negrito"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Icon icon={Bold} className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Itálico"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Icon icon={Italic} className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Sublinhado"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Icon icon={UnderlineIcon} className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

      <ToolbarButton
        label="Título H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Icon icon={Heading2} className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Título H3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Icon icon={Heading3} className="h-4 w-4" />
      </ToolbarButton>

      <label
        className="ml-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-2 text-fg-muted hover:bg-muted"
        title="Tamanho da fonte"
      >
        <Icon icon={ALargeSmall} className="h-4 w-4 text-fg" />
        <select
          className="h-7 max-w-[5.5rem] border-0 bg-transparent text-xs text-fg outline-none"
          defaultValue=""
          aria-label="Tamanho da fonte"
          onChange={(event) => {
            const value = event.target.value;
            if (!value) {
              editor.chain().focus().unsetFontSize().run();
              return;
            }
            editor.chain().focus().setFontSize(value).run();
          }}
        >
          <option value="">Padrão</option>
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </label>

      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

      <ToolbarButton
        label="Lista"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <Icon icon={List} className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <Icon icon={ListOrdered} className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Citação"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Icon icon={Quote} className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

      <ToolbarButton
        label="Alinhar à esquerda"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <Icon icon={AlignLeft} className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Centralizar"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <Icon icon={AlignCenter} className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Alinhar à direita"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <Icon icon={AlignRight} className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("URL do link", previous ?? "https://");
          if (url === null) return;
          if (!url.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
        }}
      >
        <Icon icon={Link2} className="h-4 w-4" />
      </ToolbarButton>

      <label
        className={cn(
          "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-fg transition hover:bg-muted",
        )}
        title={`Inserir imagem (até ${IMAGE_LIMITS.maxUploadLabel})`}
        aria-label={`Inserir imagem, máximo ${IMAGE_LIMITS.maxUploadLabel}`}
      >
        <Icon icon={ImagePlus} className="h-4 w-4" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            onPickImage(file);
          }}
        />
      </label>
    </div>
  );
}

function SectionEditor({
  label,
  hint,
  value,
  placeholder,
  minHeightClass,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  minHeightClass: string;
  onChange: (html: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "sf-prose max-w-none px-4 py-3 outline-none focus:outline-none",
          minHeightClass,
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const onPickImage = useCallback(
    async (file: File | undefined) => {
      if (!file || !editor) return;
      try {
        const prepared = await prepareImageUpload(file);
        const body = new FormData();
        body.set("file", prepared);
        body.set("kind", "inline");
        const response = await fetch("/api/media/upload", { method: "POST", body });
        const payload = (await response.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
          originalBytes?: number;
          optimizedBytes?: number;
        };
        if (!response.ok || !payload.url) {
          window.alert(payload.error ?? "Não foi possível enviar a imagem.");
          return;
        }
        editor.chain().focus().setImage({ src: payload.url, alt: file.name }).run();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível preparar a imagem.");
      }
    },
    [editor],
  );

  if (!editor) {
    return (
      <div className={cn("animate-pulse rounded-xl border border-border bg-muted/40", minHeightClass)} />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
        <div>
          <p className="text-sm font-semibold text-fg">{label}</p>
          <p className="text-xs text-fg-muted">{hint}</p>
        </div>
      </div>
      <EditorToolbar editor={editor} fileInputRef={fileInputRef} onPickImage={(file) => void onPickImage(file)} />
      <div className="border-b border-border bg-muted/20 px-4 py-2">
        <MediaLimitsHint variant="inline" />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export function RichDocumentEditor({
  headerHtml,
  bodyHtml,
  footerHtml,
  onChange,
}: {
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
  onChange: (next: { headerHtml: string; bodyHtml: string; footerHtml: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionEditor
        label="Cabeçalho"
        hint="Faixa institucional, saudação ou chamada no topo do comunicado."
        value={headerHtml}
        placeholder="Ex.: Comunicação Interna · Meta RH"
        minHeightClass="min-h-28"
        onChange={(html) => onChange({ headerHtml: html, bodyHtml, footerHtml })}
      />
      <SectionEditor
        label="Corpo"
        hint="Conteúdo principal: negrito, títulos, listas, imagens e alinhamento."
        value={bodyHtml}
        placeholder="Escreva o comunicado com formatação profissional…"
        minHeightClass="min-h-64"
        onChange={(html) => onChange({ headerHtml, bodyHtml: html, footerHtml })}
      />
      <SectionEditor
        label="Rodapé"
        hint="Assinatura, canais de dúvida ou aviso legal curto."
        value={footerHtml}
        placeholder="Ex.: Dúvidas? Fale com o RH no canal #comunicacao"
        minHeightClass="min-h-24"
        onChange={(html) => onChange({ headerHtml, bodyHtml, footerHtml: html })}
      />
    </div>
  );
}
