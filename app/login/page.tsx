"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Button, Input, Label } from "@/components/atoms";
import { login } from "@/modules";
import { useLoginForm } from "@/modules/auth.module/login.form";

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="relative flex items-center w-full md:w-97.5 overflow-hidden bg-white h-screen">
        <div className="flex flex-col gap-6 w-full">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10">
            <LockIcon className="size-5 text-primary" />
          </div>

          <div className="px-6 flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-center text-sm font-medium">Paguyupan System</p>
              <p className="text-center text-sm font-medium">
                Masuk menggunakan email dan password
              </p>
            </div>

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
                <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Password
                </Label>
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
          </div>
        </div>
      </div>
    </div>
  );
}
