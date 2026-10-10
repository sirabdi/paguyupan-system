"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import {
  TIPE_LABEL,
  PAKET,
  STATUS_TAMPIL_LABEL,
  statusTampil,
  type Komunitas,
  type StatusTampil,
} from "@/modules";
import { formatDateLong } from "@/utils";

export const STATUS_TAMPIL_STYLE: Record<StatusTampil, string> = {
  AKTIF: "bg-green-50 text-green-600",
  MENUNGGU_PEMBAYARAN: "bg-amber-50 text-amber-600",
  KEDALUWARSA: "bg-red-50 text-red-600",
  SUSPEND: "bg-zinc-100 text-zinc-600",
};

export function KomunitasCard({
  komunitas: k,
  onEdit,
  onDelete,
}: {
  komunitas: Komunitas;
  onEdit: (k: Komunitas) => void;
  onDelete: (k: Komunitas) => void;
}) {
  const st = statusTampil(k);

  return (
    <div className="rounded-md border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">{TIPE_LABEL[k.tipe]}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TAMPIL_STYLE[st]}`}>
              {STATUS_TAMPIL_LABEL[st]}
            </span>
          </div>
          <h3 className="mt-0.5 truncate font-semibold text-zinc-900">{k.nama}</h3>
          <p className="text-xs text-zinc-400">{k.alamatInduk ?? "—"}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit(k)}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <PencilIcon className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(k)}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
        <div>
          <p className="text-base font-bold text-zinc-900">{k.paket ? PAKET[k.paket].label : "—"}</p>
          <p className="text-[10px] text-zinc-400">Paket</p>
        </div>
        <div>
          <p className="text-base font-bold text-zinc-900">
            {k._count.anggota}/{k.kuotaAnggota}
          </p>
          <p className="text-[10px] text-zinc-400">Akun</p>
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900">{k.expiredAt ? formatDateLong(k.expiredAt) : "—"}</p>
          <p className="text-[10px] text-zinc-400">Berlaku hingga</p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-zinc-400">Terdaftar {formatDateLong(k.createdAt)}</p>
    </div>
  );
}

export function KomunitasList({
  komunitas,
  onEdit,
  onDelete,
}: {
  komunitas: Komunitas[];
  onEdit: (k: Komunitas) => void;
  onDelete: (k: Komunitas) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {komunitas.map((k) => (
        <KomunitasCard key={k.id} komunitas={k} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
