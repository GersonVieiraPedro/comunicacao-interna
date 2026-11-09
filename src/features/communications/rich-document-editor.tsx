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
  onClick: () => void;
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
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-fg transition",
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
  onUploadImage,
}: {
  editor: Editor;
  onUploadImage: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-2">
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
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
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
      <label className="ml-1 inline-flex items-center gap-1 text-xs text-fg-muted">
        Tamanho
        <select
          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-fg"
          defaultValue=""
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
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
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
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
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
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
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
      <ToolbarButton label="Inserir imagem" onClick={onUploadImage}>
        <Icon icon={ImagePlus} className="h-4 w-4" />
      </ToolbarButton>
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
  const fileRef = useRef<HTMLInputElement>(null);
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
      Image.configure({ allowBase64: false }),
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

  const uploadImage = useCallback(async () => {
    fileRef.current?.click();
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !editor) return;
      const body = new FormData();
      body.set("file", file);
      body.set("kind", "inline");
      const response = await fetch("/api/media/upload", { method: "POST", body });
      if (!response.ok) {
        window.alert("Não foi possível enviar a imagem.");
        return;
      }
      const data = (await response.json()) as { url?: string };
      if (!data.url) return;
      editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
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
      <EditorToolbar editor={editor} onUploadImage={() => void uploadImage()} />
      <EditorContent editor={editor} />
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void onFile(file);
        }}
      />
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
