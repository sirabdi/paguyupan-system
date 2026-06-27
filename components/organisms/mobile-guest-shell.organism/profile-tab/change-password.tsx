"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyRoundIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

type Step = "idle" | "sending" | "otp" | "verifying" | "form" | "saving" | "done";

const OtpSchema = z.object({
  code: z.string().length(6, "Harus 6 digit").regex(/^\d+$/, "Hanya angka"),
});

const PasswordSchema = z
  .object({
    password: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Wajib diisi"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type OtpDTO = z.infer<typeof OtpSchema>;
type PasswordDTO = z.infer<typeof PasswordSchema>;

type Props = {
  passwordChangedAt: string | null;
  onChanged: () => void;
};

export function ChangePasswordRow({ passwordChangedAt, onChanged }: Props) {
  const [step, setStep] = React.useState<Step>("idle");
  const [code, setVerifiedCode] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const otpForm = useForm<OtpDTO>({
    mode: "onTouched",
    resolver: zodResolver(OtpSchema),
  });

  const passForm = useForm<PasswordDTO>({
    mode: "onTouched",
    resolver: zodResolver(PasswordSchema),
  });

  const neverChanged = !passwordChangedAt;

  async function requestOtp() {
    setStep("sending");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "change_password" }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Gagal mengirim OTP");
      setStep("otp");
      setCooldown(60);
      toast.success("Kode OTP dikirim ke email Anda");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim OTP");
      setStep("idle");
    }
  }

  async function submitOtp(data: OtpDTO) {
    setStep("verifying");
    // Simpan kode untuk dikirim bersama password baru
    setVerifiedCode(data.code);
    setStep("form");
  }

  async function submitPassword(data: PasswordDTO) {
    setStep("saving");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password: data.password }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Gagal mengubah password");
      setStep("done");
      toast.success("Password berhasil diubah!");
      onChanged();
      setTimeout(() => setStep("idle"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
      setStep("form");
    }
  }

  function cancel() {
    setStep("idle");
    otpForm.reset();
    passForm.reset();
  }

  return (
    <div className="divide-y divide-zinc-100">
      {/* Flag password belum pernah diubah */}
      {neverChanged && step === "idle" && (
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2">
          <AlertCircleIcon className="size-3.5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-600">
            Masih menggunakan password dari Admin — sebaiknya diubah
          </p>
        </div>
      )}

      {/* Row tombol ganti password */}
      {step === "idle" && (
        <button
          onClick={requestOtp}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            <KeyRoundIcon className="size-4 text-zinc-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-800">Ganti Password</p>
            <p className="text-xs text-zinc-400">
              {neverChanged ? "Belum pernah diubah" : "Ubah password akun Anda"}
            </p>
          </div>
        </button>
      )}

      {step === "sending" && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Loader2Icon className="size-4 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">Mengirim kode OTP…</p>
        </div>
      )}

      {/* Step OTP */}
      {(step === "otp" || step === "verifying") && (
        <form onSubmit={otpForm.handleSubmit(submitOtp)} className="px-4 py-3">
          <p className="mb-2 text-xs text-zinc-500">
            Masukkan kode 6 digit yang dikirim ke email Anda
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="w-full rounded-sm border border-zinc-200 bg-white px-3 py-2 text-center text-lg font-bold tracking-widest text-zinc-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              disabled={step === "verifying"}
              {...otpForm.register("code", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                },
              })}
            />
            <button
              type="submit"
              disabled={!otpForm.formState.isValid || step === "verifying"}
              className="shrink-0 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {step === "verifying" ? "…" : "Lanjut"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="flex shrink-0 items-center justify-center rounded-sm border border-zinc-200 px-3 py-2 text-zinc-400 hover:text-zinc-600"
            >
              <XIcon className="size-4" />
            </button>
          </div>
          {otpForm.formState.errors.code && (
            <p className="mt-1 text-xs text-red-500">
              {otpForm.formState.errors.code.message}
            </p>
          )}
          {cooldown > 0 ? (
            <p className="mt-1.5 text-xs text-zinc-400">Kirim ulang dalam {cooldown}s</p>
          ) : (
            <button
              type="button"
              onClick={requestOtp}
              className="mt-1.5 text-xs text-blue-500 hover:underline"
            >
              Kirim ulang kode
            </button>
          )}
        </form>
      )}

      {/* Step form password baru */}
      {(step === "form" || step === "saving") && (
        <form onSubmit={passForm.handleSubmit(submitPassword)} className="px-4 py-3">
          <p className="mb-3 text-xs font-medium text-zinc-600">Password Baru</p>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                  className="h-9 w-full rounded-sm border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  disabled={step === "saving"}
                  {...passForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {passForm.formState.errors.password && (
                <p className="text-xs text-red-500">{passForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="grid gap-1">
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  className="h-9 w-full rounded-sm border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  disabled={step === "saving"}
                  {...passForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {passForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">{passForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!passForm.formState.isValid || step === "saving"}
                className="flex-1 rounded-sm bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              >
                {step === "saving" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" /> Menyimpan…
                  </span>
                ) : (
                  "Simpan"
                )}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="flex items-center justify-center rounded-sm border border-zinc-200 px-3 py-2 text-zinc-400 hover:text-zinc-600"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <CheckCircle2Icon className="size-5 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-700">Password berhasil diubah</p>
        </div>
      )}
    </div>
  );
}
