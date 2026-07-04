"use client";

import { CheckCircle2Icon, ReceiptIcon } from "lucide-react";

import { Badge, Button } from "@/components/atoms";
import { STATUS_IURAN_LABEL, type Iuran } from "@/modules";
import { formatDate, formatPeriode, formatRupiah } from "@/utils";

// Tampilan kartu satu tagihan iuran untuk listview (dipakai di layar kecil).
export function IuranCard({
  iuran,
  canBayar,
  onBayar,
  disabled,
}: {
  iuran: Iuran;
  canBayar: boolean;
  onBayar: (iuran: Iuran) => void;
  disabled?: boolean;
}) {
  const isLunas = iuran.status === "LUNAS";

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{iuran.anggota.nama}</p>
          <p className="text-sm text-muted-foreground">
            {formatPeriode(iuran.periode)}
          </p>
        </div>
        <span className="shrink-0 font-semibold">
          {formatRupiah(iuran.jumlah)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Badge variant={isLunas ? "default" : "secondary"}>
          {isLunas ? (
            <span className="flex items-center gap-1">
              <CheckCircle2Icon className="size-3" />
              {STATUS_IURAN_LABEL.LUNAS}
            </span>
          ) : (
            STATUS_IURAN_LABEL.BELUM_BAYAR
          )}
        </Badge>

        {isLunas ? (
          <span className="text-xs text-muted-foreground">
            Dibayar {formatDate(iuran.tanggalBayar)}
          </span>
        ) : canBayar ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBayar(iuran)}
            disabled={disabled}
          >
            <ReceiptIcon className="size-3.5" />
            Bayar
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Belum dibayar</span>
        )}
      </div>
    </div>
  );
}
