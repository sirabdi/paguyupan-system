import { z } from "zod";

export const KATEGORI_OPTIONS = ["UNDANGAN", "BERITA", "PENGUMUMAN"] as const;

export const NewsFormSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi").max(255, "Judul terlalu panjang"),
  konten: z.string().min(1, "Konten wajib diisi"),
  bannerUrl: z.string().nullable().optional(),
  kategori: z.enum(KATEGORI_OPTIONS),
});

export type NewsFormDTO = z.infer<typeof NewsFormSchema>;
