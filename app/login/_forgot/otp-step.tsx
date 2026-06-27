"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { Button, Input, Label } from "@/components/atoms";
import {
  ForgotOtpSchema,
  type ForgotOtpDTO,
} from "@/modules/auth.module/dto/auth.dto";

export function OtpStep({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (code: string) => void;
  onBack: () => void;
}) {
  const [cooldown, setCooldown] = useState(60);

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
