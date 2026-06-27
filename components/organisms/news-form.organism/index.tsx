"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Loader2Icon, UploadIcon, XIcon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { Button, Input, Label, RichTextEditor } from "@/components/atoms";
import { NEWS_KEY, createNews, updateNews, type News } from "@/modules";
import { useNewsForm } from "@/modules/news.module/news.form";
import { stripHtml } from "@/utils";

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
  const [bannerUploading, setBannerUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useNewsForm(news);

  const bannerUrl = watch("bannerUrl");

  const mutation = useMutation({
    mutationFn: (input: {
      judul: string;
      konten: string;
      bannerUrl?: string | null;
    }) => (isEdit ? updateNews(news!.id, input) : createNews(input)),
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
      setValue("bannerUrl", url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload banner");
    } finally {
      setBannerUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (!stripHtml(data.konten)) {
          toast.error("Konten wajib diisi");
          return;
        }
        mutation.mutate(data);
      })}
      className="grid gap-8"
    >
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

      <div className="grid gap-4">
        {/* Judul */}
        <div className="grid gap-1">
          <Label htmlFor="judul" className="text-sm font-medium">
            Judul <span className="text-destructive">*</span>
          </Label>
          <Input
            id="judul"
            placeholder="Judul berita"
            className="h-10 text-sm"
            autoFocus
            {...register("judul")}
          />
          {errors.judul && (
            <p className="text-xs text-destructive">{errors.judul.message}</p>
          )}
        </div>

        {/* Banner */}
        <div className="grid gap-1">
          <Label className="text-sm font-medium">
            Banner Image
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Opsional · maks. 5 MB
            </span>
          </Label>

          {bannerUrl ? (
            <div className="relative overflow-hidden rounded-xl border bg-muted">
              <div className="h-64 w-full sm:h-80">
                <img
                  src={bannerUrl}
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
                  onClick={() => setValue("bannerUrl", null)}
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

        {/* Konten */}
        <div className="grid gap-1">
          <Label className="text-sm font-medium">
            Konten <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="konten"
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Tulis isi berita di sini…"
                className="min-h-[360px]"
              />
            )}
          />
          {errors.konten && (
            <p className="text-xs text-destructive">{errors.konten.message}</p>
          )}
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
          <Button
            type="submit"
            disabled={saving || bannerUploading || !isValid}
          >
            {saving && <Loader2Icon className="animate-spin" />}
            {isEdit ? "Simpan Perubahan" : "Publikasikan"}
          </Button>
        </div>
      </div>
    </form>
  );
}
