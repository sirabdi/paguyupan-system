import { z } from "zod";

const RoleSchema = z.enum(["ADMIN", "SEKERTARIS", "BENDAHARA", "ANGGOTA"]);
const StatusSchema = z.enum(["AKTIF", "NONAKTIF"]);

export const AnggotaFormSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(255),
  email: z.email("Format email tidak valid"),
  password: z.string().optional(),
  noTelp: z.string().min(1, "No. telepon wajib diisi"),
  alamat: z.string().regex(/^\d+$/, "No. rumah harus berupa angka").min(1, "No. rumah wajib diisi"),
  role: RoleSchema.default("ANGGOTA"),
  status: StatusSchema.default("AKTIF"),
});

export type AnggotaFormDTO = z.infer<typeof AnggotaFormSchema>;

export const AnggotaCreateSchema = AnggotaFormSchema.extend({
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const AnggotaEditSchema = AnggotaFormSchema.extend({
  password: z.union([z.string().min(8, "Password minimal 8 karakter"), z.literal("")]).optional(),
});
