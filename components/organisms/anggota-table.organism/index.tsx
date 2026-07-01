"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InboxIcon, PlusIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/atoms";

import {
  ANGGOTA_KEY,
  deleteAnggota,
  fetchAnggota,
  type StatusFilter,
} from "@/modules";
import { fetchMe, ME_KEY } from "@/modules/auth.module";
import { STATUS_LABEL, type Anggota } from "@/modules/anggota.module/types";
import { AnggotaCard, AnggotaFormDialog } from "@/components/molecules";

const FILTER_LABEL: Record<StatusFilter, string> = {
  ALL: "Semua status",
  ...STATUS_LABEL,
};

// Menunda pembaruan nilai sampai pengguna berhenti mengetik.
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <p className="text-sm">Gagal memuat data anggota.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCwIcon />
        Coba lagi
      </Button>
    </div>
  );
}

function EmptyState({
  hasFilter,
  onCreate,
}: {
  hasFilter: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <InboxIcon className="size-10" />
      <p className="text-sm">
        {hasFilter
          ? "Tidak ada anggota yang cocok dengan filter."
          : "Belum ada anggota."}
      </p>
      {!hasFilter && (
        <Button variant="outline" size="sm" onClick={onCreate}>
          <PlusIcon />
          Tambah anggota pertama
        </Button>
      )}
    </div>
  );
}

export function AnggotaTable() {
  const queryClient = useQueryClient();

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const debouncedQ = useDebounced(q, 250);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Anggota | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Anggota | null>(null);

  const { data: me } = useQuery({ queryKey: ME_KEY, queryFn: fetchMe });

  const filter = { q: debouncedQ, status };
  const {
    data = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [...ANGGOTA_KEY, filter],
    queryFn: () => fetchAnggota(filter),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (target: Anggota) => deleteAnggota(target.id),
    onSuccess: (_void, target) => {
      toast.success(`Anggota "${target.nama}" dihapus`);
      queryClient.invalidateQueries({ queryKey: ANGGOTA_KEY });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(anggota: Anggota) {
    setEditing(anggota);
    setFormOpen(true);
  }

  const deleting = deleteMutation.isPending;
  const hasFilter = q.trim() !== "" || status !== "ALL";

  return (
    <>
      {/* Header: aksi + filter */}
      <div className="shrink-0 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">
            {isPending
              ? "Memuat data…"
              : `${data.length} anggota${hasFilter ? " · terfilter" : ""}`}
          </p>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon />
            Tambah
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama anggota…"
              className="pl-8"
              aria-label="Cari nama anggota"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) => FILTER_LABEL[(value as StatusFilter) ?? "ALL"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{FILTER_LABEL.ALL}</SelectItem>
              <SelectItem value="AKTIF">{FILTER_LABEL.AKTIF}</SelectItem>
              <SelectItem value="NONAKTIF">{FILTER_LABEL.NONAKTIF}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listview */}
      <div
        className="flex-1 overflow-y-auto p-4 transition-opacity data-[fetching=true]:opacity-60"
        data-fetching={isFetching && !isPending}
      >
        <div className="flex flex-col gap-2">
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-40" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            ))
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : data.length === 0 ? (
            <EmptyState hasFilter={hasFilter} onCreate={openCreate} />
          ) : (
            data.map((a) => (
              <AnggotaCard
                key={a.id}
                anggota={a}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))
          )}
        </div>
      </div>

      {/* Dialog tambah/edit */}
      <AnggotaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        anggota={editing}
        currentUserId={me?.id}
      />

      {/* Konfirmasi hapus */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Anggota{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.nama}
              </span>{" "}
              beserta seluruh riwayat iurannya akan dihapus permanen. Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget)
              }
              disabled={deleting}
            >
              {deleting ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
