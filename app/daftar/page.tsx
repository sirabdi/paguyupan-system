"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  BuildingIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms";
import {
  DaftarEmailSchema,
  DaftarSchema,
  requestDaftarOtp,
  submitDaftar,
  verifyDaftarOtp,
  type DaftarDTO,
  type DaftarEmailDTO,
} from "@/modules/daftar.module";
import { ForgotOtpSchema, type ForgotOtpDTO } from "@/modules/auth.module/dto/auth.dto";
import { TIPE_LABEL, type TipeKomunitas } from "@/modules/komunitas.module";

type Step = "email" | "otp" | "form";

const STEP_META: Record<Step, { icon: React.ReactNode; title: string; sub: string }> = {
  email: {
    icon: <MailIcon className="size-5 text-primary" />,
    title: "Daftar Komunitas",
    sub: "Langkah 1 dari 3 — verifikasi email Anda",
  },
  otp: {
    icon: <KeyRoundIcon className="size-5 text-primary" />,
    title: "Verifikasi Email",
    sub: "Langkah 2 dari 3 — masukkan kode OTP",
  },
  form: {
    icon: <BuildingIcon className="size-5 text-primary" />,
    title: "Data Admin & Komunitas",
    sub: "Langkah 3 dari 3 — Anda akan menjadi Admin komunitas",
  },
};

const TIPE_OPTIONS: TipeKomunitas[] = ["RT", "RW", "BLOK", "CUSTOM"];

export default function DaftarPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const meta = STEP_META[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="relative flex h-screen w-full overflow-y-auto bg-white md:w-97.5">
        <div className="my-auto flex w-full flex-col gap-6 py-8">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10">
            {meta.icon}
          </div>

          <div className="flex flex-col gap-4 px-6">
            <div className="flex flex-col gap-0.5">
              <p className="text-center text-sm font-semibold text-zinc-800">{meta.title}</p>
              <p className="text-center text-xs text-zinc-400">{meta.sub}</p>
            </div>

            {step === "email" ? (
              <EmailStep
                defaultEmail={email}
                onNext={(e) => {
                  setEmail(e);
                  setStep("otp");
                }}
              />
            ) : step === "otp" ? (
              <OtpStep email={email} onNext={() => setStep("form")} onBack={() => setStep("email")} />
            ) : (
              <FormStep email={email} onExpired={() => setStep("email")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Langkah 1: email ──────────────────────────────────────────────────────────

function EmailStep({ defaultEmail, onNext }: { defaultEmail: string; onNext: (email: string) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DaftarEmailDTO>({
    mode: "onTouched",
    defaultValues: { email: defaultEmail },
    resolver: zodResolver(DaftarEmailSchema),
  });

  const mutation = useMutation({
    mutationFn: (d: DaftarEmailDTO) => requestDaftarOtp(d.email),
    onSuccess: (_v, d) => {
      toast.success("Kode OTP dikirim ke email Anda");
      onNext(d.email.trim().toLowerCase());
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="daftar-email" className="text-sm font-medium text-zinc-700">
          Email
        </Label>
        <Input
          id="daftar-email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <Button
        type="submit"
        className="mt-2 h-10 w-full text-sm font-semibold"
        disabled={mutation.isPending || !isValid}
      >
        {mutation.isPending && <Loader2Icon className="animate-spin" />}
        {mutation.isPending ? "Mengirim…" : "Kirim Kode OTP"}
      </Button>

      <p className="text-center text-xs text-zinc-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}

// ── Langkah 2: OTP ────────────────────────────────────────────────────────────

function OtpStep({ email, onNext, onBack }: { email: string; onNext: () => void; onBack: () => void }) {
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
  } = useForm<ForgotOtpDTO>({ mode: "onTouched", resolver: zodResolver(ForgotOtpSchema) });

  const verifyMutation = useMutation({
    mutationFn: (d: ForgotOtpDTO) => verifyDaftarOtp(email, d.code),
    onSuccess: () => {
      toast.success("Email terverifikasi");
      onNext();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resendMutation = useMutation({
    mutationFn: () => requestDaftarOtp(email),
    onSuccess: () => {
      toast.success("Kode OTP dikirim ulang");
      setCooldown(60);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => verifyMutation.mutate(d))} className="grid gap-3">
      <p className="text-xs text-zinc-500">
        Masukkan kode 6 digit yang dikirim ke{" "}
        <span className="font-medium text-zinc-700">{email}</span>
      </p>

      <div className="grid gap-1">
        <Label htmlFor="daftar-otp" className="text-sm font-medium text-zinc-700">
          Kode OTP
        </Label>
        <Input
          id="daftar-otp"
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
        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
      </div>

      {cooldown > 0 ? (
        <p className="text-center text-xs text-zinc-400">Kirim ulang dalam {cooldown}s</p>
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
        disabled={!isValid || verifyMutation.isPending}
      >
        {verifyMutation.isPending && <Loader2Icon className="animate-spin" />}
        Verifikasi
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

// ── Langkah 3: data admin & komunitas ─────────────────────────────────────────

function FormStep({ email, onExpired }: { email: string; onExpired: () => void }) {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DaftarDTO>({
    mode: "onTouched",
    defaultValues: {
      nama: "",
      noTelp: "",
      password: "",
      konfirmasiPassword: "",
      namaKomunitas: "",
      tipe: "RT",
      alamatKomunitas: "",
    },
    resolver: zodResolver(DaftarSchema),
  });

  const mutation = useMutation({
    mutationFn: submitDaftar,
    onSuccess: () => {
      toast.success("Pendaftaran berhasil. Silakan pilih paket langganan.");
      router.push("/langganan");
    },
    onError: (err: Error) => {
      toast.error(err.message);
      if (err.message.includes("Sesi verifikasi email habis")) onExpired();
    },
  });

  const fieldError = (msg?: string) => (msg ? <p className="text-xs text-destructive">{msg}</p> : null);

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Data Admin</p>

      <div className="grid gap-1">
        <Label className="text-sm font-medium text-zinc-700">Email</Label>
        <Input value={email} disabled readOnly />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="nama" className="text-sm font-medium text-zinc-700">
          Nama Lengkap
        </Label>
        <Input id="nama" placeholder="Nama Anda" {...register("nama")} />
        {fieldError(errors.nama?.message)}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="noTelp" className="text-sm font-medium text-zinc-700">
          No Telp
        </Label>
        <Input id="noTelp" type="tel" inputMode="tel" placeholder="081234567890" {...register("noTelp")} />
        {fieldError(errors.noTelp?.message)}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
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
        {fieldError(errors.password?.message)}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="konfirmasiPassword" className="text-sm font-medium text-zinc-700">
          Konfirmasi Password
        </Label>
        <Input
          id="konfirmasiPassword"
          type={showPass ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Ulangi password"
          {...register("konfirmasiPassword")}
        />
        {fieldError(errors.konfirmasiPassword?.message)}
      </div>

      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Data Komunitas</p>

      <div className="grid gap-1">
        <Label htmlFor="namaKomunitas" className="text-sm font-medium text-zinc-700">
          Nama Komunitas
        </Label>
        <Input id="namaKomunitas" placeholder="Cth: RT 01 RW 05 Kel. Cibadak" {...register("namaKomunitas")} />
        {fieldError(errors.namaKomunitas?.message)}
      </div>

      <div className="grid gap-1">
        <Label className="text-sm font-medium text-zinc-700">Tipe Komunitas</Label>
        <Controller
          control={control}
          name="tipe"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pilih tipe">
                  {field.value ? TIPE_LABEL[field.value as TipeKomunitas] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} label={TIPE_LABEL[t]}>
                    {TIPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {fieldError(errors.tipe?.message)}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="alamatKomunitas" className="text-sm font-medium text-zinc-700">
          Alamat Komunitas
        </Label>
        <Textarea
          id="alamatKomunitas"
          rows={2}
          placeholder="Cth: Kel. Cibadak, Kec. Tanah Sareal, Kota Bogor"
          {...register("alamatKomunitas")}
        />
        {fieldError(errors.alamatKomunitas?.message)}
      </div>

      <Button type="submit" className="mt-2 h-10 w-full text-sm font-semibold" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2Icon className="animate-spin" />}
        {mutation.isPending ? "Mendaftarkan…" : "Daftar & Pilih Paket"}
      </Button>
    </form>
  );
}
