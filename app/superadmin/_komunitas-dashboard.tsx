"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  Loader2Icon,
  BuildingIcon,
  UserPlusIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Button,
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
import { AdminForm } from "@/components/organisms/admin-form.organism";
import { KomunitasList } from "@/components/molecules/komunitas-card.molecule";
import {
  fetchKomunitas,
  createKomunitas,
  createKomunitasAdmin,
  updateKomunitas,
  deleteKomunitas,
  KOMUNITAS_KEY,
  STATUS_LABEL,
  type Komunitas,
  type KomunitasInput,
  type AdminInput,
  type StatusKomunitas,
} from "@/modules";

export function KomunitasDashboard({
  initialData,
}: {
  initialData: Komunitas[];
}) {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Komunitas | null>(null);
  const [adminTarget, setAdminTarget] = React.useState<Komunitas | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Komunitas | null>(
    null,
  );
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<
    StatusKomunitas | "SEMUA"
  >("SEMUA");

  const { data: komunitas = initialData } = useQuery({
    queryKey: [...KOMUNITAS_KEY],
    queryFn: fetchKomunitas,
    initialData,
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return komunitas.filter((k) => {
      const matchStatus = filterStatus === "SEMUA" || k.status === filterStatus;
      const matchSearch =
        !q ||
        k.nama.toLowerCase().includes(q) ||
        (k.alamatInduk ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [komunitas, search, filterStatus]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: KOMUNITAS_KEY });

  const createMutation = useMutation({
    mutationFn: createKomunitas,
    onSuccess: () => {
      toast.success("Komunitas berhasil dibuat");
      setCreateOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const createAdminMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdminInput }) =>
      createKomunitasAdmin(id, input),
    onSuccess: () => {
      toast.success("Admin berhasil ditambahkan, masa berlaku mulai berjalan");
      setAdminTarget(null);
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
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {komunitas.length} komunitas terdaftar
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Tambah Komunitas
        </Button>
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
          onValueChange={(v) => setFilterStatus(v as StatusKomunitas | "SEMUA")}
        >
          <SelectTrigger className="data-[size=default]:!h-9 w-full sm:w-44">
            <SelectValue placeholder="Semua Status">
              {filterStatus === "SEMUA"
                ? "Semua Status"
                : STATUS_LABEL[filterStatus as StatusKomunitas]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA" label="Semua Status">
              Semua Status
            </SelectItem>
            {(["TRIAL", "AKTIF", "SUSPEND"] as StatusKomunitas[]).map((s) => (
              <SelectItem key={s} value={s} label={STATUS_LABEL[s]}>
                {STATUS_LABEL[s]}
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
          onAddAdmin={setAdminTarget}
        />
      )}

      {/* Dialog tambah komunitas */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BuildingIcon className="size-4" />
              Tambah Komunitas
            </DialogTitle>
          </DialogHeader>
          <KomunitasForm
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

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
              defaultValues={{
                nama: editTarget.nama,
                tipe: editTarget.tipe,
                kuotaAnggota: editTarget.kuotaAnggota,
                status: editTarget.status,
                alamatInduk: editTarget.alamatInduk ?? "",
                durasi: editTarget.durasiHari
                  ? String(editTarget.durasiHari)
                  : "null",
              }}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editTarget.id, data })
              }
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog tambah admin */}
      <Dialog
        open={!!adminTarget}
        onOpenChange={(o) => {
          if (!o) setAdminTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlusIcon className="size-4" />
              Tambah Admin
            </DialogTitle>
          </DialogHeader>
          {adminTarget && (
            <AdminForm
              komunitas={adminTarget}
              onSubmit={(data) =>
                createAdminMutation.mutate({ id: adminTarget.id, input: data })
              }
              isPending={createAdminMutation.isPending}
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
