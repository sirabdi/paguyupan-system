"use client";

import * as React from "react";
import { Loader2Icon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button, Input, Label, DialogFooter } from "@/components/atoms";
import { type AdminInput, type Komunitas } from "@/modules";
import { DURASI_OPTIONS } from "@/components/organisms/komunitas-form.organism";

type FormValues = AdminInput;

export function AdminForm({
  komunitas,
  onSubmit,
  isPending,
}: {
  komunitas: Komunitas;
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      noTelp: "",
      alamat: "",
    },
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const durasiLabel =
    DURASI_OPTIONS.find((d) => d.days === komunitas.durasiHari)?.label ??
    (komunitas.durasiHari
      ? `${komunitas.durasiHari} hari`
      : "Tidak ada batas waktu");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="rounded-md bg-zinc-50 border px-3 py-2 text-xs text-zinc-500 grid gap-0.5">
        <p>
          Komunitas:{" "}
          <span className="font-semibold text-zinc-700">{komunitas.nama}</span>
        </p>
        <p>
          Masa berlaku:{" "}
          <span className="font-semibold text-zinc-700">{durasiLabel}</span> —
          mulai berjalan sekarang
        </p>
      </div>

      <div className="grid gap-1">
        <Label className="gap-0.5">
          Nama Admin <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="Nama lengkap"
          {...register("nama", { required: "Wajib diisi" })}
        />
        {errors.nama && (
          <p className="text-xs text-destructive">{errors.nama.message}</p>
        )}
      </div>

      <div className="grid gap-1">
        <Label className="gap-0.5">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          type="email"
          placeholder="admin@email.com"
          {...register("email", {
            required: "Wajib diisi",
            pattern: { value: /\S+@\S+\.\S+/, message: "Email tidak valid" },
          })}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-1">
        <Label className="gap-0.5">
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            className="pr-10"
            {...register("password", {
              required: "Wajib diisi",
              minLength: { value: 8, message: "Minimal 8 karakter" },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="grid gap-1">
        <Label className="gap-0.5">
          No. Telepon <span className="text-destructive">*</span>
        </Label>
        <Input
          type="tel"
          placeholder="08xxxxxxxxxx"
          {...register("noTelp", { required: "No. telepon wajib diisi" })}
        />
        {errors.noTelp && (
          <p className="text-xs text-destructive">{errors.noTelp.message}</p>
        )}
      </div>

      <div className="grid gap-1">
        <Label className="gap-0.5">
          No. Rumah <span className="text-destructive">*</span>
        </Label>
        <Input
          inputMode="numeric"
          placeholder="Contoh: 29"
          {...register("alamat", {
            required: "No. rumah wajib diisi",
            pattern: {
              value: /^\d+$/,
              message: "No. rumah harus berupa angka",
            },
          })}
        />
        {errors.alamat && (
          <p className="text-xs text-destructive">{errors.alamat.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Tambah Admin
        </Button>
      </DialogFooter>
    </form>
  );
}
