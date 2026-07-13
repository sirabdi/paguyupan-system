"use client";

import { PencilIcon, Trash2Icon, UserPlusIcon, AlertCircleIcon, BuildingIcon } from "lucide-react";
import { TIPE_LABEL, STATUS_LABEL, type Komunitas, type StatusKomunitas } from "@/modules";

const STATUS_STYLE: Record<StatusKomunitas, string> = {
  TRIAL: "bg-amber-50 text-amber-600",
  AKTIF: "bg-green-50 text-green-600",
  SUSPEND: "bg-red-50 text-red-600",
};

const DURASI_LABELS: Record<number, string> = {
  30: "30 Hari",
  90: "90 Hari",
  365: "1 Tahun",
  730: "2 Tahun",
  1095: "3 Tahun",
};

// ── KomunitasCard ─────────────────────────────────────────────────────────────

export function KomunitasCard({
  komunitas: k,
  onEdit,
  onDelete,
  onAddAdmin,
}: {
  komunitas: Komunitas;
  onEdit: (k: Komunitas) => void;
  onDelete: (k: Komunitas) => void;
  onAddAdmin: (k: Komunitas) => void;
}) {
  const noAdmin = k._count.anggota === 0;

  return (
    <div className={`rounded-md border bg-white p-5 shadow-sm ${noAdmin ? "border-amber-200" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-400">{TIPE_LABEL[k.tipe]}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[k.status]}`}>
              {STATUS_LABEL[k.status]}
            </span>
          </div>
          <h3 className="mt-0.5 truncate font-semibold text-zinc-900">{k.nama}</h3>
          <p className="text-xs text-zinc-400">{k.alamatInduk ?? "—"}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {noAdmin && (
            <button
              onClick={() => onAddAdmin(k)}
              className="flex size-7 items-center justify-center rounded-md text-amber-500 hover:bg-amber-50 hover:text-amber-600"
              title="Tambah Admin"
            >
              <UserPlusIcon className="size-3.5" />
            </button>
          )}
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
          <p className="text-base font-bold text-zinc-900">{k._count.anggota}</p>
          <p className="text-[10px] text-zinc-400">Anggota</p>
        </div>
        <div>
          <p className="text-base font-bold text-zinc-900">{k.kuotaAnggota}</p>
          <p className="text-[10px] text-zinc-400">Kuota</p>
        </div>
        <div>
          <p className="truncate text-xs font-bold text-zinc-900">{k.kode ?? "—"}</p>
          <p className="text-[10px] text-zinc-400">Kode</p>
        </div>
      </div>

      {noAdmin ? (
        <button
          onClick={() => onAddAdmin(k)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-amber-300 py-1.5 text-xs text-amber-600 hover:bg-amber-50"
        >
          <UserPlusIcon className="size-3.5" />
          Tambah Admin
        </button>
      ) : k.expiredAt ? (
        <p className="mt-2 text-[10px] text-zinc-400">
          Berlaku hingga:{" "}
          {new Date(k.expiredAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      ) : null}
    </div>
  );
}

// ── KomunitasList (2 section: menunggu admin + sudah ada admin) ───────────────

export function KomunitasList({
  komunitas,
  onEdit,
  onDelete,
  onAddAdmin,
}: {
  komunitas: Komunitas[];
  onEdit: (k: Komunitas) => void;
  onDelete: (k: Komunitas) => void;
  onAddAdmin: (k: Komunitas) => void;
}) {
  const needAdmin = komunitas.filter((k) => k._count.anggota === 0);
  const hasAdmin  = komunitas.filter((k) => k._count.anggota > 0);

  return (
    <div className="grid gap-8">
      {needAdmin.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertCircleIcon className="size-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-600">Menunggu Admin ({needAdmin.length})</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {needAdmin.map((k) => (
              <KomunitasCard key={k.id} komunitas={k} onEdit={onEdit} onDelete={onDelete} onAddAdmin={onAddAdmin} />
            ))}
          </div>
        </section>
      )}

      {hasAdmin.length > 0 && (
        <section>
          {needAdmin.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <BuildingIcon className="size-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-600">Komunitas Aktif ({hasAdmin.length})</h2>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {hasAdmin.map((k) => (
              <KomunitasCard key={k.id} komunitas={k} onEdit={onEdit} onDelete={onDelete} onAddAdmin={onAddAdmin} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
