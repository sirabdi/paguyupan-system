"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  ArrowLeftIcon,
  MailIcon,
  KeyRoundIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, Label } from "@/components/atoms";
import { login } from "@/modules";
import { useLoginForm } from "@/modules/auth.module/login.form";
import {
  ForgotEmailSchema,
  ForgotOtpSchema,
  ResetPasswordSchema,
  type ForgotEmailDTO,
  type ForgotOtpDTO,
  type ResetPasswordDTO,
} from "@/modules/auth.module/dto/auth.dto";

type ForgotStep = "email" | "otp" | "reset" | "done";

// ─── Sub-form: input email ────────────────────────────────────────────────────
function ForgotEmailStep({
  onNext,
  onBack,
}: {
  onNext: (email: string) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotEmailDTO>({
    mode: "onTouched",
    resolver: zodResolver(ForgotEmailSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: ForgotEmailDTO) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Gagal mengirim OTP");
      }
    },
    onSuccess: (_v, data) => {
      toast.success("Kode OTP dikirim ke email Anda");
      onNext(data.email);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="fp-email" className="text-sm font-medium text-zinc-700">
          Email terdaftar
        </Label>
        <Input
          id="fp-email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          autoFocus
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="mt-2 h-10 w-full text-sm font-semibold"
        disabled={mutation.isPending || !isValid}
      >
        {mutation.isPending && <Loader2Icon className="animate-spin" />}
        {mutation.isPending ? "Mengirim…" : "Kirim Kode OTP"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
      >
        <ArrowLeftIcon className="size-3" />
        Kembali ke login
      </button>
    </form>
  );
}

// ─── Sub-form: input OTP ─────────────────────────────────────────────────────
function ForgotOtpStep({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (code: string) => void;
  onBack: () => void;
}) {
  const [cooldown, setCooldown] = useState(60);

  // Hitung mundur
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotOtpDTO>({
    mode: "onTouched",
    resolver: zodResolver(ForgotOtpSchema),
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Gagal mengirim ulang");
      }
    },
    onSuccess: () => {
      toast.success("Kode OTP dikirim ulang");
      setCooldown(60);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => onNext(d.code))} className="grid gap-3">
      <p className="text-xs text-zinc-500">
        Masukkan kode 6 digit yang dikirim ke{" "}
        <span className="font-medium text-zinc-700">{email}</span>
      </p>

      <div className="grid gap-1">
        <Label htmlFor="fp-otp" className="text-sm font-medium text-zinc-700">
          Kode OTP
        </Label>
        <Input
          id="fp-otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoFocus
          className="text-center text-xl font-bold tracking-widest"
          {...register("code", {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "");
            },
          })}
        />
        {errors.code && (
          <p className="text-xs text-destructive">{errors.code.message}</p>
        )}
      </div>

      {cooldown > 0 ? (
        <p className="text-center text-xs text-zinc-400">
          Kirim ulang dalam {cooldown}s
        </p>
      ) : (
        <button
          type="button"
          onClick={() => resendMutation.mutate()}
          disabled={resendMutation.isPending}
          className="text-center text-xs text-blue-500 hover:underline disabled:opacity-50"
        >
          {resendMutation.isPending ? "Mengirim…" : "Kirim ulang kode"}
        </button>
      )}

      <Button
        type="submit"
        className="h-10 w-full text-sm font-semibold"
        disabled={!isValid}
      >
        Lanjut
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
      >
        <ArrowLeftIcon className="size-3" />
        Ganti email
      </button>
    </form>
  );
}

// ─── Sub-form: reset password ─────────────────────────────────────────────────
function ResetPasswordStep({
  email,
  code,
  onDone,
}: {
  email: string;
  code: string;
  onDone: () => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordDTO>({
    mode: "onTouched",
    resolver: zodResolver(ResetPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordDTO) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password: data.password }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Gagal reset password");
      }
    },
    onSuccess: () => onDone(),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="new-password" className="text-sm font-medium text-zinc-700">
          Password baru
        </Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 karakter"
            autoFocus
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            tabIndex={-1}
          >
            {showPass ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="confirm-password" className="text-sm font-medium text-zinc-700">
          Konfirmasi password
        </Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="mt-2 h-10 w-full text-sm font-semibold"
        disabled={mutation.isPending || !isValid}
      >
        {mutation.isPending && <Loader2Icon className="animate-spin" />}
        {mutation.isPending ? "Menyimpan…" : "Simpan Password Baru"}
      </Button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  // forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useLoginForm();

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      login(data.email, data.password),
    onSuccess: (user) => {
      const dest =
        user.role === "ADMIN"
          ? "/anggota"
          : user.role === "SEKERTARIS"
            ? "/news"
            : "/guest";
      router.push(dest);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const loading = mutation.isPending;

  function openForgot() {
    setForgotStep("email");
    setForgotEmail("");
    setForgotCode("");
    setForgotOpen(true);
  }

  // ── Konten header & icon tiap step forgot ──
  const forgotMeta: Record<ForgotStep, { icon: React.ReactNode; title: string; sub: string }> = {
    email: {
      icon: <MailIcon className="size-5 text-primary" />,
      title: "Lupa Password",
      sub: "Masukkan email terdaftar untuk menerima kode OTP",
    },
    otp: {
      icon: <KeyRoundIcon className="size-5 text-primary" />,
      title: "Verifikasi OTP",
      sub: "Cek inbox email Anda",
    },
    reset: {
      icon: <LockIcon className="size-5 text-primary" />,
      title: "Password Baru",
      sub: "Buat password baru yang kuat",
    },
    done: {
      icon: <CheckCircle2Icon className="size-5 text-emerald-600" />,
      title: "Berhasil!",
      sub: "Password berhasil diubah",
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="relative flex items-center w-full md:w-97.5 overflow-hidden bg-white h-screen">
        <div className="flex flex-col gap-6 w-full">

          {/* ── Icon ── */}
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10">
            {forgotOpen
              ? forgotMeta[forgotStep].icon
              : <LockIcon className="size-5 text-primary" />}
          </div>

          <div className="px-6 flex flex-col gap-4">
            {/* ── Title ── */}
            <div className="flex flex-col gap-0.5">
              {forgotOpen ? (
                <>
                  <p className="text-center text-sm font-semibold text-zinc-800">
                    {forgotMeta[forgotStep].title}
                  </p>
                  <p className="text-center text-xs text-zinc-400">
                    {forgotMeta[forgotStep].sub}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-center text-sm font-medium">Paguyupan System</p>
                  <p className="text-center text-sm font-medium">
                    Masuk menggunakan email dan password
                  </p>
                </>
              )}
            </div>

            {/* ── Body ── */}
            {!forgotOpen ? (
              // Form login
              <>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="grid gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      autoFocus
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid gap-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={openForgot}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Lupa password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPass ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        tabIndex={-1}
                      >
                        {showPass ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="mt-2 h-10 w-full text-sm font-semibold"
                    disabled={loading}
                  >
                    {loading && <Loader2Icon className="animate-spin" />}
                    {loading ? "Memverifikasi…" : "Masuk"}
                  </Button>
                </form>

                <p className="text-center text-xs text-zinc-400">
                  Hubungi Admin jika belum memiliki akses.
                </p>
              </>
            ) : forgotStep === "email" ? (
              <ForgotEmailStep
                onNext={(email) => { setForgotEmail(email); setForgotStep("otp"); }}
                onBack={() => setForgotOpen(false)}
              />
            ) : forgotStep === "otp" ? (
              <ForgotOtpStep
                email={forgotEmail}
                onNext={(code) => { setForgotCode(code); setForgotStep("reset"); }}
                onBack={() => setForgotStep("email")}
              />
            ) : forgotStep === "reset" ? (
              <ResetPasswordStep
                email={forgotEmail}
                code={forgotCode}
                onDone={() => setForgotStep("done")}
              />
            ) : (
              // done
              <div className="grid gap-4">
                <p className="text-center text-sm text-zinc-600">
                  Silakan login dengan password baru Anda.
                </p>
                <Button
                  className="h-10 w-full text-sm font-semibold"
                  onClick={() => setForgotOpen(false)}
                >
                  Ke Halaman Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
