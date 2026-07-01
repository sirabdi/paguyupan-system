"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InboxIcon, RefreshCwIcon } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/atoms";

import {
  IURAN_KEY,
  STATUS_IURAN_LABEL,
  bayarIuran,
  fetchIuran,
  type Iuran,
  type StatusIuranFilter,
} from "@/modules";
import { formatPeriode } from "@/utils";
import { IuranCard } from "@/components/molecules";

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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <p className="text-sm">Gagal memuat data iuran.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCwIcon />
        Coba lagi
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <InboxIcon className="size-10" />
      <p className="text-sm">Tidak ada data iuran untuk periode ini.</p>
    </div>
  );
}

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
      {/* Header: ringkasan + filter */}
      <div className="shrink-0 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">
            {isPending
              ? "Memuat data…"
              : `${data.length} tagihan · ${sudahBayar} lunas · ${belumBayar} belum`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCwIcon className={isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Select value={periode} onValueChange={(v) => v && setPeriode(v)}>
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v) => STATUS_FILTER_LABEL[(v as StatusIuranFilter) ?? "ALL"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{STATUS_FILTER_LABEL.ALL}</SelectItem>
              <SelectItem value="BELUM_BAYAR">
                {STATUS_FILTER_LABEL.BELUM_BAYAR}
              </SelectItem>
              <SelectItem value="LUNAS">{STATUS_FILTER_LABEL.LUNAS}</SelectItem>
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
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
                <Skeleton className="mt-3 h-5 w-full" />
              </div>
            ))
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : data.length === 0 ? (
            <EmptyState />
          ) : (
            data.map((iuran) => (
              <IuranCard
                key={iuran.id}
                iuran={iuran}
                canBayar={canBayar}
                onBayar={setKonfirmasiTarget}
                disabled={memproses}
              />
            ))
          )}
        </div>
      </div>

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
