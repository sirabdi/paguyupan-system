import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
export type LoginDTO = z.infer<typeof LoginSchema>;

export const ForgotEmailSchema = z.object({
  email: z.email("Format email tidak valid"),
});
export type ForgotEmailDTO = z.infer<typeof ForgotEmailSchema>;

export const ForgotOtpSchema = z.object({
  code: z.string().length(6, "Kode harus 6 digit").regex(/^\d+$/, "Hanya angka"),
});
export type ForgotOtpDTO = z.infer<typeof ForgotOtpSchema>;

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
