"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  KeyRoundIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button, Input, Label } from "@/components/atoms";
import { login } from "@/modules";
import { useLoginForm } from "@/modules/auth.module/login.form";
import { EmailStep } from "./_forgot/email-step";
import { OtpStep } from "./_forgot/otp-step";
import { ResetStep } from "./_forgot/reset-step";

type ForgotStep = "email" | "otp" | "reset" | "done";

const FORGOT_META: Record<ForgotStep, { icon: React.ReactNode; title: string; sub: string }> = {
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

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");

  const { register, handleSubmit, formState: { errors } } = useLoginForm();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      login(data.email, data.password),
    onSuccess: () => {
      router.push("/guest");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openForgot() {
    setForgotStep("email");
    setForgotEmail("");
    setForgotCode("");
    setForgotOpen(true);
  }

  const meta = forgotOpen ? FORGOT_META[forgotStep] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="relative flex items-center w-full md:w-97.5 overflow-hidden bg-white h-screen">
        <div className="flex flex-col gap-6 w-full">

          {/* Icon */}
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10">
            {meta ? meta.icon : <LockIcon className="size-5 text-primary" />}
          </div>

          <div className="px-6 flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-0.5">
              {meta ? (
                <>
                  <p className="text-center text-sm font-semibold text-zinc-800">{meta.title}</p>
                  <p className="text-center text-xs text-zinc-400">{meta.sub}</p>
                </>
              ) : (
                <>
                  <p className="text-center text-sm font-medium">Paguyupan System</p>
                  <p className="text-center text-sm font-medium">Masuk menggunakan email dan password</p>
                </>
              )}
            </div>

            {/* Body */}
            {!forgotOpen ? (
              <>
                <form
                  onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
                  className="grid gap-3"
                >
                  <div className="grid gap-1">
                    <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
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
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && <Loader2Icon className="animate-spin" />}
                    {loginMutation.isPending ? "Memverifikasi…" : "Masuk"}
                  </Button>
                </form>

                <p className="text-center text-xs text-zinc-400">
                  Hubungi Admin jika belum memiliki akses.
                </p>
              </>
            ) : forgotStep === "email" ? (
              <EmailStep
                onNext={(email) => { setForgotEmail(email); setForgotStep("otp"); }}
                onBack={() => setForgotOpen(false)}
              />
            ) : forgotStep === "otp" ? (
              <OtpStep
                email={forgotEmail}
                onNext={(code) => { setForgotCode(code); setForgotStep("reset"); }}
                onBack={() => setForgotStep("email")}
              />
            ) : forgotStep === "reset" ? (
              <ResetStep
                email={forgotEmail}
                code={forgotCode}
                onDone={() => setForgotStep("done")}
              />
            ) : (
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
