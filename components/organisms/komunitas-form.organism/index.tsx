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
  type KomunitasInput,
  type TipeKomunitas,
  type StatusKomunitas,
} from "@/modules";

const TIPE_OPTIONS: TipeKomunitas[] = ["RT", "RW", "BLOK", "CUSTOM"];
const STATUS_OPTIONS: StatusKomunitas[] = ["TRIAL", "AKTIF", "SUSPEND"];

export const DURASI_OPTIONS: { label: string; days: number | null }[] = [
  { label: "Tidak ada batas waktu", days: null },
  { label: "30 Hari", days: 30 },
  { label: "90 Hari", days: 90 },
  { label: "1 Tahun", days: 365 },
  { label: "2 Tahun", days: 730 },
  { label: "3 Tahun", days: 1095 },
];

type FormValues = Omit<KomunitasInput, "kode" | "durasiHari"> & {
  durasi: string;
};

export function KomunitasForm({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Partial<FormValues>;
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
      nama: "",
      tipe: "RT",
      kuotaAnggota: 50,
      status: "TRIAL",
      alamatInduk: "",
      durasi: "null",
      ...defaultValues,
    },
  });

  function onSubmitForm(values: FormValues) {
    const days = values.durasi === "null" ? null : Number(values.durasi);
    onSubmit({
      nama: values.nama,
      tipe: values.tipe,
      kuotaAnggota: values.kuotaAnggota,
      status: values.status,
      alamatInduk: values.alamatInduk,
      durasiHari: days,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="grid gap-4">
      <div className="grid gap-1">
        <Label className="gap-0.5">
          Nama Komunitas <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="Cth: RT 01 RW 05 Kel. Cibadak"
          {...register("nama", { required: "Wajib diisi" })}
        />
        {errors.nama && (
          <p className="text-xs text-destructive">{errors.nama.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label className="gap-0.5">
            Tipe <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="tipe"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih tipe">
                    {field.value ? TIPE_LABEL[field.value] : undefined}
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
        </div>

        <div className="grid gap-1">
          <Label className="gap-0.5">
            Status <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih status">
                    {field.value
                      ? STATUS_LABEL[field.value as StatusKomunitas]
                      : undefined}
                  </SelectValue>
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
        <Label className="gap-0.5">
          Kuota Anggota <span className="text-destructive">*</span>
        </Label>
        <Input
          type="number"
          min={1}
          {...register("kuotaAnggota", {
            required: true,
            min: 1,
            valueAsNumber: true,
          })}
        />
      </div>

      <div className="grid gap-1">
        <Label className="gap-0.5">
          Alamat Induk <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="Cth: Kel. Cibadak, Kec. Tanah Sareal"
          {...register("alamatInduk", { required: "Alamat induk wajib diisi" })}
        />
        {errors.alamatInduk && (
          <p className="text-xs text-destructive">
            {errors.alamatInduk.message}
          </p>
        )}
      </div>

      <div className="grid gap-1">
        <Label className="gap-0.5">Masa Berlaku</Label>
        <p className="text-[11px] text-zinc-400">
          Durasi mulai dihitung saat admin pertama ditambahkan.
        </p>
        <Controller
          control={control}
          name="durasi"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pilih durasi">
                  {
                    DURASI_OPTIONS.find((d) => String(d.days) === field.value)
                      ?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DURASI_OPTIONS.map((d) => (
                  <SelectItem
                    key={String(d.days)}
                    value={String(d.days)}
                    label={d.label}
                  >
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Simpan
        </Button>
      </DialogFooter>
    </form>
  );
}
