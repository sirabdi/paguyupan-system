"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EllipsisIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
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
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms";

import {
  ANGGOTA_KEY,
  deleteAnggota,
  fetchAnggota,
  type StatusFilter,
} from "@/modules";
import { STATUS_LABEL, type Anggota } from "@/modules/anggota.module/types";
import { AnggotaFormDialog } from "@/components/molecules";
import { formatDate } from "@/utils";

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

export function AnggotaTable() {
  const queryClient = useQueryClient();

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const debouncedQ = useDebounced(q, 250);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Anggota | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Anggota | null>(null);

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
    placeholderData: (prev) => prev, // pertahankan baris lama saat filter berubah
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
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="size-4" />
          Anggota
        </CardTitle>
        <CardDescription>
          {isPending
            ? "Memuat data…"
            : `${data.length} anggota${hasFilter ? " (terfilter)" : ""}`}
        </CardDescription>
        <CardAction>
          <Button onClick={openCreate}>
            <PlusIcon />
            Tambah Anggota
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Filter & pencarian */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
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
            <SelectTrigger className="sm:w-44">
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

        {/* Tabel */}
        <div
          className="rounded-lg border data-[fetching=true]:opacity-60 transition-opacity"
          data-fetching={isFetching && !isPending}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead className="hidden md:table-cell">Alamat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Bergabung
                </TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                      <p>Gagal memuat data anggota.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                      >
                        <RefreshCwIcon />
                        Coba lagi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                      <InboxIcon className="size-8" />
                      <p>
                        {hasFilter
                          ? "Tidak ada anggota yang cocok dengan filter."
                          : "Belum ada anggota."}
                      </p>
                      {!hasFilter && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openCreate}
                        >
                          <PlusIcon />
                          Tambah anggota pertama
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nama}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{a.email || "—"}</span>
                        <span className="text-muted-foreground">
                          {a.noTelp || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate md:table-cell">
                      {a.alamat || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={a.status === "AKTIF" ? "default" : "secondary"}
                      >
                        {STATUS_LABEL[a.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDate(a.tanggalGabung)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                          aria-label={`Aksi untuk ${a.nama}`}
                        >
                          <EllipsisIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(a)}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(a)}
                          >
                            <Trash2Icon />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog tambah/edit */}
      <AnggotaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        anggota={editing}
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
    </Card>
  );
}
