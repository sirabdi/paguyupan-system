"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, BuildingIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms";
import { SearchBar } from "@/components/molecules";
import { KomunitasForm } from "@/components/organisms/komunitas-form.organism";
import { KomunitasList } from "@/components/molecules/komunitas-card.molecule";
import {
  fetchKomunitas,
  updateKomunitas,
  deleteKomunitas,
  KOMUNITAS_KEY,
  STATUS_TAMPIL_LABEL,
  statusTampil,
  type Komunitas,
  type KomunitasInput,
  type StatusTampil,
} from "@/modules";

const FILTER_STATUS: StatusTampil[] = ["AKTIF", "MENUNGGU_PEMBAYARAN", "KEDALUWARSA", "SUSPEND"];

export function KomunitasDashboard({
  initialData,
}: {
  initialData: Komunitas[];
}) {
  const queryClient = useQueryClient();

  const [editTarget, setEditTarget] = React.useState<Komunitas | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Komunitas | null>(
    null,
  );
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<
    StatusTampil | "SEMUA"
  >("SEMUA");

  const { data: komunitas = initialData } = useQuery({
    queryKey: [...KOMUNITAS_KEY],
    queryFn: fetchKomunitas,
    initialData,
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return komunitas.filter((k) => {
      const matchStatus = filterStatus === "SEMUA" || statusTampil(k) === filterStatus;
      const matchSearch =
        !q ||
        k.nama.toLowerCase().includes(q) ||
        (k.alamatInduk ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [komunitas, search, filterStatus]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: KOMUNITAS_KEY });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KomunitasInput> }) =>
      updateKomunitas(id, data),
    onSuccess: () => {
      toast.success("Komunitas diperbarui");
      setEditTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKomunitas,
    onSuccess: () => {
      toast.success("Komunitas dihapus");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      {/* Header — komunitas mendaftar sendiri lewat /daftar */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FILTER_STATUS.map((s) => (
          <div key={s} className="rounded-md border bg-white px-4 py-3">
            <p className="text-lg font-bold text-zinc-900">
              {komunitas.filter((k) => statusTampil(k) === s).length}
            </p>
            <p className="text-xs text-zinc-400">{STATUS_TAMPIL_LABEL[s]}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari nama atau alamat komunitas…"
          className="flex-1 rounded-sm"
        />
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as StatusTampil | "SEMUA")}
        >
          <SelectTrigger className="data-[size=default]:!h-9 w-full sm:w-44">
            <SelectValue placeholder="Semua Status">
              {filterStatus === "SEMUA"
                ? "Semua Status"
                : STATUS_TAMPIL_LABEL[filterStatus as StatusTampil]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA" label="Semua Status">
              Semua Status
            </SelectItem>
            {FILTER_STATUS.map((s) => (
              <SelectItem key={s} value={s} label={STATUS_TAMPIL_LABEL[s]}>
                {STATUS_TAMPIL_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {komunitas.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center text-zinc-400">
          <BuildingIcon className="size-10" />
          <p className="text-sm">Belum ada komunitas terdaftar.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center text-zinc-400">
          <SearchIcon className="size-10" />
          <p className="text-sm">Tidak ada komunitas yang cocok.</p>
        </div>
      ) : (
        <KomunitasList
          komunitas={filtered}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Dialog edit komunitas */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Komunitas</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <KomunitasForm
              komunitas={editTarget}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editTarget.id, data })
              }
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Komunitas?</AlertDialogTitle>
            <AlertDialogDescription>
              Komunitas <strong>{deleteTarget?.nama}</strong> beserta seluruh
              anggotanya ({deleteTarget?._count.anggota} anggota) akan dihapus
              permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
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
