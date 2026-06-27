"use client";

import * as React from "react";
import {
  CheckCircle2Icon,
  MailIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

type Step = "idle" | "sending" | "input" | "verifying" | "done";

type Props = {
  email: string;
  verified: boolean;
  onVerified: () => void;
};

export function EmailVerifyRow({ email, verified, onVerified }: Props) {
  const [step, setStep] = React.useState<Step>("idle");
  const [code, setCode] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function requestOtp() {
    setStep("sending");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "verify_email" }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Gagal mengirim OTP");
      setStep("input");
      setCooldown(60);
      toast.success("Kode OTP dikirim ke email Anda");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim OTP");
      setStep("idle");
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setStep("verifying");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Verifikasi gagal");
      setStep("done");
      toast.success("Email berhasil diverifikasi!");
      onVerified();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verifikasi gagal");
      setStep("input");
    }
  }

  const isVerified = verified || step === "done";

  return (
    <div className="divide-y divide-zinc-100">
      {!isVerified && (
        <div className="px-4 py-1 bg-amber-50 text-amber-600">
          <p className="text-xs flex items-center gap-1 font-bold">
            <ShieldCheckIcon className="size-4" />
            Email belum terverifikasi!
          </p>
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
          <MailIcon className="size-4 text-zinc-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-400">Email</p>
          <p className="truncate text-sm font-medium text-zinc-800">{email}</p>
        </div>
        {isVerified ? (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
            <CheckCircle2Icon className="size-3" />
            Terverifikasi
          </div>
        ) : (
          <button
            onClick={requestOtp}
            disabled={step === "sending"}
            className="flex shrink-0 items-center gap-1 rounded-sm bg-amber-50 p-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            {step === "sending" ? "Mengirim…" : "Verifikasi"}
          </button>
        )}
      </div>

      {(step === "input" || step === "verifying") && (
        <form onSubmit={submitOtp} className="px-4 py-3">
          <p className="mb-2 text-xs text-zinc-500">
            Masukkan kode 6 digit yang dikirim ke{" "}
            <span className="font-medium text-zinc-700">{email}</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-sm border border-zinc-200 bg-white px-3 py-2 text-center text-lg font-bold tracking-widest text-zinc-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              disabled={step === "verifying"}
            />
            <button
              type="submit"
              disabled={code.length !== 6 || step === "verifying"}
              className="shrink-0 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {step === "verifying" ? "…" : "Verifikasi"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("idle"); setCode(""); }}
              className="flex shrink-0 items-center justify-center rounded-sm border border-zinc-200 px-3 py-2 text-zinc-400 hover:text-zinc-600"
            >
              <XIcon className="size-4" />
            </button>
          </div>
          {cooldown > 0 ? (
            <p className="mt-1.5 text-xs text-zinc-400">
              Kirim ulang dalam {cooldown}s
            </p>
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
    </div>
  );
}
