"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";

import { Button, Input, Label } from "@/components/atoms";
import {
  ResetPasswordSchema,
  type ResetPasswordDTO,
} from "@/modules/auth.module/dto/auth.dto";

export function ResetStep({
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
    trigger,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordDTO>({
    mode: "onChange",
    resolver: zodResolver(ResetPasswordSchema),
  });

  const passwordVal = watch("password") ?? "";
  const confirmVal = watch("confirmPassword") ?? "";

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
            {...register("password", {
              onChange: () => trigger("confirmPassword"),
            })}
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
        {errors.password && passwordVal.length > 0 && (
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
        {errors.confirmPassword && passwordVal.length > 0 && confirmVal.length > 0 && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="mt-2 h-10 w-full text-sm font-semibold"
        disabled={mutation.isPending || !isValid || !passwordVal || !confirmVal}
      >
        {mutation.isPending && <Loader2Icon className="animate-spin" />}
        {mutation.isPending ? "Menyimpan…" : "Simpan Password Baru"}
      </Button>
    </form>
  );
}
