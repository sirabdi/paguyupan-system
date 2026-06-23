"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, UploadIcon, XIcon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { Button, Input, Label, RichTextEditor } from "@/components/atoms";

import {
  NEWS_KEY,
  createNews,
  updateNews,
  type News,
  type NewsInput,
} from "@/modules";

type FormState = { judul: string; konten: string; bannerUrl: string | null };

const EMPTY: FormState = { judul: "", konten: "", bannerUrl: null };

function toFormState(news: News): FormState {
  return { judul: news.judul, konten: news.konten, bannerUrl: news.bannerUrl };
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

async function uploadBanner(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Gagal upload banner");
  }
  return ((await res.json()) as { url: string }).url;
}

export function NewsForm({ news }: { news?: News }) {
  const isEdit = Boolean(news);
  const router = useRouter();
  const queryClient = useQueryClient();
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = React.useState<FormState>(() =>
    news ? toFormState(news) : EMPTY,
  );
  const [bannerUploading, setBannerUploading] = React.useState(false);

  const mutation = useMutation({
    mutationFn: (input: NewsInput) =>
      isEdit ? updateNews(news!.id, input) : createNews(input),
    onSuccess: (saved) => {
      toast.success(
        isEdit ? "Berita diperbarui" : `Berita "${saved.judul}" dipublikasikan`,
      );
      queryClient.invalidateQueries({ queryKey: NEWS_KEY });
      router.push("/news");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saving = mutation.isPending;

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Hanya gambar JPEG, PNG, WebP, GIF, atau AVIF yang diizinkan",
      );
      return;
    }
    setBannerUploading(true);
    try {
      const url = await uploadBanner(file);
      setForm((f) => ({ ...f, bannerUrl: url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload banner");
    } finally {
      setBannerUploading(false);
    }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const judul = form.judul.trim();
    if (!judul) {
      toast.error("Judul wajib diisi");
      return;
    }
    if (!form.konten.replace(/<[^>]*>/g, "").trim()) {
      toast.error("Konten wajib diisi");
      return;
    }
    mutation.mutate({
      judul,
      konten: form.konten.trim(),
      bannerUrl: form.bannerUrl,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      {/* Kembali */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/news")}
          className="-ml-1"
        >
          <ArrowLeftIcon />
          Kembali ke daftar berita
        </Button>
      </div>

      {/* Judul */}
      <div className="grid gap-2">
        <Label htmlFor="judul" className="text-base font-medium">
          Judul <span className="text-destructive">*</span>
        </Label>
        <Input
          id="judul"
          value={form.judul}
          onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
          placeholder="Judul berita"
          className="h-10 text-base"
          autoFocus
          required
        />
      </div>

      {/* Banner */}
      <div className="grid gap-2">
        <Label className="text-base font-medium">
          Banner Image
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Opsional · maks. 5 MB
          </span>
        </Label>

        {form.bannerUrl ? (
          <div className="relative overflow-hidden rounded-xl border bg-muted">
            <div className="h-64 w-full sm:h-80">
              <img
                src={form.bannerUrl}
                alt="Banner preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="bg-background/80 backdrop-blur"
              >
                {bannerUploading ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <UploadIcon />
                )}
                Ganti
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={() => setForm((f) => ({ ...f, bannerUrl: null }))}
                aria-label="Hapus banner"
                className="bg-destructive/80 text-white backdrop-blur"
              >
                <XIcon />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
            className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/30 text-muted-foreground transition-colors hover:border-ring hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50 sm:h-56"
          >
            {bannerUploading ? (
              <Loader2Icon className="size-7 animate-spin" />
            ) : (
              <UploadIcon className="size-7" />
            )}
            <span className="text-sm font-medium">
              {bannerUploading ? "Mengupload…" : "Klik untuk upload banner"}
            </span>
            <span className="text-xs">JPEG, PNG, WebP, GIF, AVIF</span>
          </button>
        )}

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />
      </div>

      {/* Konten editor */}
      <div className="grid gap-2">
        <Label className="text-base font-medium">
          Konten <span className="text-destructive">*</span>
        </Label>
        <RichTextEditor
          value={form.konten}
          onChange={(html) => setForm((f) => ({ ...f, konten: html }))}
          placeholder="Tulis isi berita di sini…"
          className="min-h-[360px]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/news")}
          disabled={saving || bannerUploading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={saving || bannerUploading}>
          {saving && <Loader2Icon className="animate-spin" />}
          {isEdit ? "Simpan Perubahan" : "Publikasikan"}
        </Button>
      </div>
    </form>
  );
}
