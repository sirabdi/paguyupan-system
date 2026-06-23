"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  Heading2Icon,
  Heading3Icon,
  QuoteIcon,
  Undo2Icon,
  Redo2Icon,
  ImageIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/button.atom";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

type Level = 1 | 2 | 3 | 4 | 5 | 6;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "Gagal upload gambar");
  }
  const data = await res.json() as { url: string };
  return data.url;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Tulis konten di sini…" }),
    ],
    content: value ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  async function handleImageFile(file: File) {
    if (!editor) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Hanya gambar JPEG, PNG, WebP, GIF, atau AVIF yang diizinkan");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await handleImageFile(file);
    e.target.value = "";
  }

  if (!editor) return null;

  const toolbarBtn = (active: boolean) =>
    cn("size-7 shrink-0", active && "bg-muted text-foreground");

  return (
    <div className={cn("flex flex-col rounded-lg border border-input", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        ><BoldIcon /></Button>

        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        ><ItalicIcon /></Button>

        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("underline"))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
        ><UnderlineIcon /></Button>

        <span className="mx-1 h-5 w-px bg-border" />

        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("heading", { level: 2 as Level }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 as Level }).run()}
          aria-label="Heading 2"
        ><Heading2Icon /></Button>

        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("heading", { level: 3 as Level }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 as Level }).run()}
          aria-label="Heading 3"
        ><Heading3Icon /></Button>

        <span className="mx-1 h-5 w-px bg-border" />

        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        ><ListIcon /></Button>

        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered list"
        ><ListOrderedIcon /></Button>

        <Button
          type="button" variant="ghost" size="icon-sm"
          className={toolbarBtn(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Blockquote"
        ><QuoteIcon /></Button>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Image upload */}
        <Button
          type="button" variant="ghost" size="icon-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Sisipkan gambar"
          title="Sisipkan gambar ke konten"
        >
          {uploading ? <Loader2Icon className="animate-spin" /> : <ImageIcon />}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageInputChange}
        />

        <span className="mx-1 h-5 w-px bg-border" />

        <Button
          type="button" variant="ghost" size="icon-sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        ><Undo2Icon /></Button>

        <Button
          type="button" variant="ghost" size="icon-sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        ><Redo2Icon /></Button>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-3 py-2 [&_.tiptap]:min-h-[180px] [&_.tiptap]:outline-none [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
