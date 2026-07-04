"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Input,
  Label,
  RichTextEditor,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms";
import {
  NEWS_KEY,
  createNews,
  updateNews,
  type News,
  KATEGORI_LABEL,
} from "@/modules";
import { KATEGORI_OPTIONS } from "@/modules/news.module/dto/news.dto";
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
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useNewsForm(news);

  const mutation = useMutation({
    mutationFn: (input: {
      judul: string;
      konten: string;
      bannerUrl?: string | null;
      kategori: import("@/modules").KategoriNews;
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

  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (!stripHtml(data.konten)) {
          toast.error("Konten wajib diisi");
          return;
        }
        mutation.mutate(data);
      })}
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Body (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">
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
                <div className="h-52 w-full">
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
                className="flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/30 text-muted-foreground transition-colors hover:border-ring hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
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
                  className="min-h-75"
                />
              )}
            />
            {errors.konten && (
              <p className="text-xs text-destructive">{errors.konten.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action bar (sticky footer) */}
      <div className="flex shrink-0 items-center gap-3 border-t bg-white p-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/news")}
          disabled={saving || bannerUploading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={saving || bannerUploading || !isValid}
        >
          {saving && <Loader2Icon className="animate-spin" />}
          {isEdit ? "Simpan Perubahan" : "Publikasikan"}
        </Button>
      </div>
    </form>
  );
}
