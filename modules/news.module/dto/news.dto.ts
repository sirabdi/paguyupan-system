import { z } from "zod";

export const NewsFormSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi").max(255, "Judul terlalu panjang"),
  konten: z.string().min(1, "Konten wajib diisi"),
  bannerUrl: z.string().nullable().optional(),
});

export type NewsFormDTO = z.infer<typeof NewsFormSchema>;
