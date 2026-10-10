import { z } from "zod";

export const DaftarEmailSchema = z.object({
  email: z.email("Format email tidak valid"),
});
export type DaftarEmailDTO = z.infer<typeof DaftarEmailSchema>;

export const DaftarSchema = z
  .object({
    nama: z.string().trim().min(1, "Nama wajib diisi").max(100),
    noTelp: z
      .string()
      .trim()
      .regex(/^(\+62|62|0)8\d{7,12}$/, "Format no telp tidak valid (cth: 081234567890)"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    konfirmasiPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    namaKomunitas: z.string().trim().min(1, "Nama komunitas wajib diisi").max(150),
    tipe: z.enum(["RT", "RW", "BLOK", "CUSTOM"], "Tipe komunitas wajib dipilih"),
    alamatKomunitas: z.string().trim().min(1, "Alamat komunitas wajib diisi").max(255),
  })
  .refine((d) => d.password === d.konfirmasiPassword, {
    message: "Password tidak cocok",
    path: ["konfirmasiPassword"],
  });
export type DaftarDTO = z.infer<typeof DaftarSchema>;
