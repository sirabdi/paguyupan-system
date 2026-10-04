"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  EllipsisIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Skeleton,
} from "@/components/atoms";
import {
  JENIS_IURAN_KEY,
  fetchJenisIuran,
  createJenisIuran,
  updateJenisIuran,
  deleteJenisIuran,
  intervalLabel,
  INTERVAL_OPTIONS,
  IURAN_KEY,
  type JenisIuran,
} from "@/modules";
import { formatRupiah } from "@/utils";

type FormState = { nama: string; jumlah: string; intervalBulan: string };
const EMPTY_FORM: FormState = { nama: "", jumlah: "", intervalBulan: "1" };

export function JenisIuranManager({
  maxIuranTambahan,
}: {
  maxIuranTambahan: number;
}) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<JenisIuran | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = React.useState<JenisIuran | null>(
    null,
  );

  const { data: list = [], isPending } = useQuery({
    queryKey: JENIS_IURAN_KEY,
    queryFn: fetchJenisIuran,
  });

  const tambahan = list.filter((j) => !j.isDefault);
  const sisaKuota = maxIuranTambahan - tambahan.length;
  const isEditDefault = editTarget?.isDefault ?? false;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: JENIS_IURAN_KEY });
    queryClient.invalidateQueries({ queryKey: IURAN_KEY });
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(j: JenisIuran) {
    setEditTarget(j);
    setForm({
      nama: j.nama,
      jumlah: String(Math.round(Number(j.jumlah))),
      intervalBulan: String(j.intervalBulan),
    });
    setFormOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        nama: form.nama.trim(),
        jumlah: Number(form.jumlah),
        intervalBulan: Number(form.intervalBulan),
      };
      return editTarget
        ? updateJenisIuran(editTarget.id, input)
        : createJenisIuran(input);
    },
    onSuccess: () => {
      toast.success(editTarget ? "Jenis iuran diperbarui" : "Jenis iuran ditambahkan");
      setFormOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJenisIuran(id),
    onSuccess: () => {
      toast.success("Jenis iuran dihapus");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama.trim()) return toast.error("Nama iuran wajib diisi");
    const n = Number(form.jumlah);
    if (!form.jumlah.trim() || !Number.isFinite(n) || n < 0)
      return toast.error("Nominal tidak valid");
    saveMutation.mutate();
  }

  const saving = saveMutation.isPending;

  return (
    <>
      {/* Header: aksi + info kuota */}
      <div className="shrink-0 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">
            {isPending
              ? "Memuat data…"
              : `${tambahan.length} dari ${maxIuranTambahan} iuran tambahan`}
          </p>
          <Button size="sm" onClick={openCreate} disabled={sisaKuota <= 0}>
            <PlusIcon />
            Tambah
          </Button>
        </div>
        {sisaKuota <= 0 && (
          <p className="mt-2 text-xs text-amber-600">
            Kuota iuran tambahan penuh. Hubungi superadmin untuk menambah kuota.
          </p>
        )}
      </div>

      {/* Listview */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {isPending ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-40" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            ))
          ) : (
            list.map((j) => (
              <div
                key={j.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{j.nama}</span>
                    {j.isDefault && <Badge variant="secondary">Default</Badge>}
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {formatRupiah(j.jumlah)}
                    </span>
                    <span>{intervalLabel(j.intervalBulan)}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" />}
                    aria-label={`Aksi untuk ${j.nama}`}
                  >
                    <EllipsisIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(j)}>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                    {!j.isDefault && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(j)}
                      >
                        <Trash2Icon />
                        Hapus
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dialog tambah/edit */}
      <Dialog open={formOpen} onOpenChange={(o) => !saving && setFormOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editTarget
                  ? isEditDefault
                    ? "Edit Iuran Bulanan"
                    : "Edit Jenis Iuran"
                  : "Tambah Jenis Iuran"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-1">
              <Label className="gap-0.5">Nama Iuran</Label>
              <Input
                placeholder="Cth: Iuran Kebersihan"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                disabled={isEditDefault}
                autoFocus={!isEditDefault}
              />
              {isEditDefault && (
                <p className="text-[11px] text-zinc-400">
                  Nama iuran bulanan default tidak dapat diubah.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="gap-0.5">Nominal (Rp)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  placeholder="20000"
                  value={form.jumlah}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jumlah: e.target.value }))
                  }
                  autoFocus={isEditDefault}
                />
              </div>
              <div className="grid gap-1">
                <Label className="gap-0.5">Ditagih</Label>
                <Select
                  value={form.intervalBulan}
                  onValueChange={(v) =>
                    v && setForm((f) => ({ ...f, intervalBulan: v }))
                  }
                >
                  <SelectTrigger className="w-full" disabled={isEditDefault}>
                    <SelectValue>
                      {intervalLabel(Number(form.intervalBulan))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2Icon className="animate-spin" />}
                {editTarget ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jenis Iuran?</AlertDialogTitle>
            <AlertDialogDescription>
              Jenis iuran{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.nama}
              </span>{" "}
              beserta seluruh tagihannya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2Icon className="animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
