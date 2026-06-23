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
  type Role,
  type StatusAnggota,
} from "@/modules/anggota.module/types";

type FormState = {
  nama: string;
  email: string;
  password: string;
  noTelp: string;
  alamat: string;
  status: StatusAnggota;
  role: Role;
};

const EMPTY_FORM: FormState = {
  nama: "",
  email: "",
  password: "",
  noTelp: "",
  alamat: "",
  status: "AKTIF",
  role: "ANGGOTA",
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  SEKERTARIS: "Sekertaris",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

function toFormState(anggota: Anggota): FormState {
  return {
    nama: anggota.nama,
    email: anggota.email ?? "",
    password: "",
    noTelp: anggota.noTelp ?? "",
    alamat: anggota.alamat ?? "",
    status: anggota.status,
    role: (anggota.role as Role) ?? "ANGGOTA",
  };
}

export function AnggotaFormDialog({
  open,
  onOpenChange,
  anggota,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anggota?: Anggota | null;
}) {
  const isEdit = Boolean(anggota);
  const queryClient = useQueryClient();

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [wasOpen, setWasOpen] = React.useState(false);

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
        isEdit ? "Data anggota diperbarui" : `Anggota "${saved.nama}" ditambahkan`,
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
    if (!nama) { toast.error("Nama wajib diisi"); return; }

    const email = form.email.trim();
    if (!email) { toast.error("Email wajib diisi"); return; }

    if (!isEdit && form.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (isEdit && form.password && form.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    mutation.mutate({
      nama,
      email,
      noTelp: form.noTelp.trim(),
      alamat: form.alamat.trim(),
      status: form.status,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Anggota" : "Tambah Anggota"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Perbarui data anggota. Kosongkan password jika tidak ingin mengubahnya."
                : "Isi data anggota baru. Password minimal 8 karakter."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="nama">Nama <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="nama@email.com"
                required
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
            <Label htmlFor="password">
              Password{!isEdit && <span className="text-destructive"> *</span>}
              {isEdit && <span className="ml-1 text-xs text-muted-foreground">(kosongkan jika tidak diubah)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder={isEdit ? "••••••••" : "Min. 8 karakter"}
              required={!isEdit}
              minLength={!isEdit ? 8 : undefined}
              autoComplete="new-password"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => update("role", value as Role)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) => (value ? ROLE_LABEL[value as Role] : "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{ROLE_LABEL.ADMIN}</SelectItem>
                  <SelectItem value="SEKERTARIS">{ROLE_LABEL.SEKERTARIS}</SelectItem>
                  <SelectItem value="BENDAHARA">{ROLE_LABEL.BENDAHARA}</SelectItem>
                  <SelectItem value="ANGGOTA">{ROLE_LABEL.ANGGOTA}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", value as StatusAnggota)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) => (value ? STATUS_LABEL[value as StatusAnggota] : "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">{STATUS_LABEL.AKTIF}</SelectItem>
                  <SelectItem value="NONAKTIF">{STATUS_LABEL.NONAKTIF}</SelectItem>
                </SelectContent>
              </Select>
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
