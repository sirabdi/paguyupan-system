"use client";

import { Loader2Icon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";

import {
  Button,
  Input,
  Label,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms";
import {
  TIPE_LABEL,
  STATUS_LABEL,
  PAKET,
  PAKET_LIST,
  type Komunitas,
  type KomunitasInput,
  type TipeKomunitas,
  type StatusKomunitas,
} from "@/modules";

const TIPE_OPTIONS: TipeKomunitas[] = ["RT", "RW", "BLOK", "CUSTOM"];
const STATUS_OPTIONS: StatusKomunitas[] = ["MENUNGGU_PEMBAYARAN", "AKTIF", "SUSPEND"];
const TANPA_PAKET = "NONE";

type FormValues = {
  nama: string;
  tipe: TipeKomunitas;
  alamatInduk: string;
  status: StatusKomunitas;
  paket: string; // Paket | "NONE"
  expiredDate: string; // yyyy-mm-dd (lokal)
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Edit komunitas oleh Superadmin: data dasar + intervensi manual langganan
// (suspend, ganti paket, atur masa berlaku untuk kompensasi).
export function KomunitasForm({
  komunitas,
  onSubmit,
  isPending,
}: {
  komunitas: Komunitas;
  onSubmit: (data: KomunitasInput) => void;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nama: komunitas.nama,
      tipe: komunitas.tipe,
      alamatInduk: komunitas.alamatInduk ?? "",
      status: komunitas.status,
      paket: komunitas.paket ?? TANPA_PAKET,
      expiredDate: toDateInput(komunitas.expiredAt),
    },
  });

  function onSubmitForm(v: FormValues) {
    onSubmit({
      nama: v.nama,
      tipe: v.tipe,
      alamatInduk: v.alamatInduk,
      status: v.status,
      paket: v.paket === TANPA_PAKET ? null : (v.paket as KomunitasInput["paket"]),
      // Berlaku sampai akhir hari yang dipilih (waktu lokal)
      expiredAt: v.expiredDate ? new Date(`${v.expiredDate}T23:59:59`).toISOString() : null,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="grid gap-4">
      <div className="grid gap-1">
        <Label className="gap-0.5">
          Nama Komunitas <span className="text-destructive">*</span>
        </Label>
        <Input {...register("nama", { required: "Wajib diisi" })} />
        {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label>Tipe</Label>
          <Controller
            control={control}
            name="tipe"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>{TIPE_LABEL[field.value]}</SelectValue>
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
        </div>

        <div className="grid gap-1">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>{STATUS_LABEL[field.value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} label={STATUS_LABEL[s]}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-1">
        <Label>Alamat Komunitas</Label>
        <Input {...register("alamatInduk")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label>Paket</Label>
          <Controller
            control={control}
            name="paket"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>
                    {field.value === TANPA_PAKET
                      ? "Belum ada"
                      : PAKET[field.value as keyof typeof PAKET].label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TANPA_PAKET} label="Belum ada">
                    Belum ada
                  </SelectItem>
                  {PAKET_LIST.map((p) => (
                    <SelectItem key={p} value={p} label={PAKET[p].label}>
                      {PAKET[p].label} ({PAKET[p].kuotaAnggota} akun)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-1">
          <Label>Berlaku hingga</Label>
          <Input type="date" className="h-10" {...register("expiredDate")} />
        </div>
      </div>
      <p className="-mt-2 text-[11px] text-zinc-400">
        Ubah paket / masa berlaku hanya untuk penyesuaian manual (mis. kompensasi). Normalnya
        diperbarui otomatis dari pembayaran.
      </p>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Simpan
        </Button>
      </DialogFooter>
    </form>
  );
}
