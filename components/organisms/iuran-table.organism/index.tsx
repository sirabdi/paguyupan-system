"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  InboxIcon,
  RefreshCwIcon,
  ReceiptIcon,
  WalletIcon,
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
  IURAN_KEY,
  STATUS_IURAN_LABEL,
  bayarIuran,
  fetchIuran,
  type Iuran,
  type StatusIuranFilter,
} from "@/modules";
import { formatDate, formatPeriode, formatRupiah } from "@/utils";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Hasilkan daftar periode YYYY-MM dari bulan ini mundur sejumlah `count`. */
function generatePeriodes(count = 13): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${y}-${m}`);
  }
  return result;
}

const PERIODES = generatePeriodes(13);

const STATUS_FILTER_LABEL: Record<StatusIuranFilter, string> = {
  ALL: "Semua status",
  BELUM_BAYAR: STATUS_IURAN_LABEL.BELUM_BAYAR,
  LUNAS: STATUS_IURAN_LABEL.LUNAS,
};

// ── Component ────────────────────────────────────────────────────────────────

type Props = {
  /** Hanya Admin yang bisa menandai lunas; Bendahara read-only. */
  canBayar: boolean;
};

export function IuranTable({ canBayar }: Props) {
  const queryClient = useQueryClient();

  const [periode, setPeriode] = React.useState<string>(PERIODES[0]);
  const [status, setStatus] = React.useState<StatusIuranFilter>("ALL");
  const [konfirmasiTarget, setKonfirmasiTarget] = React.useState<Iuran | null>(
    null,
  );

  const filter = { periode, status };
  const {
    data = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [...IURAN_KEY, filter],
    queryFn: () => fetchIuran(filter),
    placeholderData: (prev) => prev,
  });

  const bayarMutation = useMutation({
    mutationFn: (iuran: Iuran) => bayarIuran(iuran.id),
    onSuccess: (_updated, iuran) => {
      toast.success(
        `Iuran ${iuran.anggota.nama} — ${formatPeriode(iuran.periode)} ditandai lunas`,
      );
      queryClient.invalidateQueries({ queryKey: IURAN_KEY });
      setKonfirmasiTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sudahBayar = data.filter((d) => d.status === "LUNAS").length;
  const belumBayar = data.filter((d) => d.status === "BELUM_BAYAR").length;
  const memproses = bayarMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="size-4" />
            Iuran
          </CardTitle>
          <CardDescription>
            {isPending
              ? "Memuat data…"
              : `${data.length} tagihan · ${sudahBayar} lunas · ${belumBayar} belum bayar`}
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCwIcon className={isFetching ? "animate-spin" : ""} />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Filter */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={periode} onValueChange={(v) => v && setPeriode(v)}>
              <SelectTrigger className="sm:w-52">
                <SelectValue>
                  {(v) => formatPeriode((v as string) ?? PERIODES[0])}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PERIODES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {formatPeriode(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StatusIuranFilter)}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue>
                  {(v) =>
                    STATUS_FILTER_LABEL[(v as StatusIuranFilter) ?? "ALL"]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{STATUS_FILTER_LABEL.ALL}</SelectItem>
                <SelectItem value="BELUM_BAYAR">
                  {STATUS_FILTER_LABEL.BELUM_BAYAR}
                </SelectItem>
                <SelectItem value="LUNAS">
                  {STATUS_FILTER_LABEL.LUNAS}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabel */}
          <div
            className="rounded-lg border transition-opacity data-[fetching=true]:opacity-60"
            data-fetching={isFetching && !isPending}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Periode
                  </TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Tgl Bayar
                  </TableHead>
                  {canBayar && (
                    <TableHead className="w-28 text-center">Aksi</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: canBayar ? 6 : 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={canBayar ? 6 : 5}>
                      <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                        <p>Gagal memuat data iuran.</p>
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
                    <TableCell colSpan={canBayar ? 6 : 5}>
                      <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                        <InboxIcon className="size-8" />
                        <p>Tidak ada data iuran untuk periode ini.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((iuran) => (
                    <TableRow key={iuran.id}>
                      <TableCell className="font-medium">
                        {iuran.anggota.nama}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatPeriode(iuran.periode)}
                      </TableCell>
                      <TableCell>{formatRupiah(iuran.jumlah)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            iuran.status === "LUNAS" ? "default" : "secondary"
                          }
                        >
                          {iuran.status === "LUNAS" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2Icon className="size-3" />
                              {STATUS_IURAN_LABEL.LUNAS}
                            </span>
                          ) : (
                            STATUS_IURAN_LABEL.BELUM_BAYAR
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(iuran.tanggalBayar)}
                      </TableCell>
                      {canBayar && (
                        <TableCell className="text-center">
                          {iuran.status === "BELUM_BAYAR" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setKonfirmasiTarget(iuran)}
                              disabled={memproses}
                            >
                              <ReceiptIcon className="size-3.5" />
                              Bayar
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog konfirmasi bayar */}
      <AlertDialog
        open={konfirmasiTarget !== null}
        onOpenChange={(open) => {
          if (!open && !memproses) setKonfirmasiTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Tandai iuran{" "}
              <span className="font-medium text-foreground">
                {konfirmasiTarget?.anggota.nama}
              </span>{" "}
              periode{" "}
              <span className="font-medium text-foreground">
                {konfirmasiTarget ? formatPeriode(konfirmasiTarget.periode) : ""}
              </span>{" "}
              sebagai <span className="font-medium text-foreground">Lunas</span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={memproses}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                konfirmasiTarget && bayarMutation.mutate(konfirmasiTarget)
              }
              disabled={memproses}
            >
              {memproses ? "Memproses…" : "Ya, Tandai Lunas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
