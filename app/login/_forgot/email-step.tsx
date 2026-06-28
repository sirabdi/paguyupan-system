"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { Button, Input, Label } from "@/components/atoms";
import {
  ForgotEmailSchema,
  type ForgotEmailDTO,
} from "@/modules/auth.module/dto/auth.dto";

export function EmailStep({
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
