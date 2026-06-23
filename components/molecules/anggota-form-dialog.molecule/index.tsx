"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/atoms";

import {
  ANGGOTA_KEY,
  createAnggota,
  updateAnggota,
  type AnggotaInput,
} from "@/modules";

import {
  STATUS_LABEL,
  type Anggota,
  type StatusAnggota,
} from "@/modules/anggota.module/types";

type FormState = {
  nama: string;
  email: string;
  noTelp: string;
  alamat: string;
  status: StatusAnggota;
};

const EMPTY_FORM: FormState = {
  nama: "",
  email: "",
  noTelp: "",
  alamat: "",
  status: "AKTIF",
};

function toFormState(anggota: Anggota): FormState {
  return {
    nama: anggota.nama,
    email: anggota.email ?? "",
    noTelp: anggota.noTelp ?? "",
    alamat: anggota.alamat ?? "",
    status: anggota.status,
  };
}

export function AnggotaFormDialog({
  open,
  onOpenChange,
  anggota,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Diisi untuk mode edit; kosong untuk mode tambah. */
  anggota?: Anggota | null;
}) {
  const isEdit = Boolean(anggota);
  const queryClient = useQueryClient();

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [wasOpen, setWasOpen] = React.useState(false);

  // Reset isi form saat dialog beralih dari tertutup → terbuka.
  // Menyesuaikan state selama render adalah pola yang direkomendasikan React
  // (lebih tepat daripada useEffect untuk turunan dari props).
  if (open && !wasOpen) {
    setWasOpen(true);
    setForm(anggota ? toFormState(anggota) : EMPTY_FORM);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const mutation = useMutation({
    mutationFn: (input: AnggotaInput) =>
      isEdit ? updateAnggota(anggota!.id, input) : createAnggota(input),
    onSuccess: (saved) => {
      toast.success(
        isEdit
          ? "Data anggota diperbarui"
          : `Anggota "${saved.nama}" ditambahkan`,
      );
      queryClient.invalidateQueries({ queryKey: ANGGOTA_KEY });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saving = mutation.isPending;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    const nama = form.nama.trim();
    if (!nama) {
      toast.error("Nama wajib diisi");
      return;
    }

    const email = form.email.trim();
    mutation.mutate({
      nama,
      noTelp: form.noTelp.trim(),
      alamat: form.alamat.trim(),
      status: form.status,
      ...(email ? { email } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Anggota" : "Tambah Anggota"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Perbarui data anggota lalu simpan."
                : "Isi data anggota baru. Hanya nama yang wajib diisi."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="nama">
              Nama <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama"
              value={form.nama}
              onChange={(e) => update("nama", e.target.value)}
              placeholder="Nama lengkap"
              autoFocus
              required
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="nama@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="noTelp">No. Telepon</Label>
              <Input
                id="noTelp"
                inputMode="tel"
                value={form.noTelp}
                onChange={(e) => update("noTelp", e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea
              id="alamat"
              value={form.alamat}
              onChange={(e) => update("alamat", e.target.value)}
              placeholder="Alamat domisili"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                update("status", value as StatusAnggota)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) =>
                    value ? STATUS_LABEL[value as StatusAnggota] : ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AKTIF">{STATUS_LABEL.AKTIF}</SelectItem>
                <SelectItem value="NONAKTIF">
                  {STATUS_LABEL.NONAKTIF}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2Icon className="animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
