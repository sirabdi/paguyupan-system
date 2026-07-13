"use client";

import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  WalletIcon,
} from "lucide-react";

import { formatDate, formatPeriode, formatRupiah } from "@/utils";
import type { IuranItem } from "../index";
import { HeaderActions } from "@/components/molecules/header-action.molecule";
import { Badge } from "@/components/atoms";

export function IuranTab({
  iuran,
  role,
  komunitasNama,
}: {
  iuran: IuranItem[];
  role: string;
  komunitasNama: string | null;
}) {
  const lunas = iuran.filter((i) => i.status === "LUNAS").length;
  const belum = iuran.length - lunas;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Iuran Saya</h1>
            <div className="mt-1 flex items-center gap-2">
              {komunitasNama && (
                <Badge variant="secondary" className="gap-1">
                  <MapPinIcon className="size-3 shrink-0" />
                  <span className="truncate">{komunitasNama}</span>
                </Badge>
              )}
            </div>
          </div>
          <HeaderActions role={role} />
        </div>
      </div>

      {iuran.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 bg-white px-5 py-3">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-zinc-50 px-2 py-2.5">
            <CalendarIcon className="size-4 text-zinc-400" />
            <span className="text-base font-bold text-zinc-900">
              {iuran.length}
            </span>
            <span className="text-[10px] text-zinc-400">Periode</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-green-50 px-2 py-2.5">
            <CheckCircle2Icon className="size-4 text-green-500" />
            <span className="text-base font-bold text-green-700">{lunas}</span>
            <span className="text-[10px] text-green-600">Lunas</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-amber-50 px-2 py-2.5">
            <ClockIcon className="size-4 text-amber-500" />
            <span className="text-base font-bold text-amber-700">{belum}</span>
            <span className="text-[10px] text-amber-600">Belum Bayar</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {iuran.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-400">
            <WalletIcon className="size-10" />
            <p className="text-sm">Belum ada tagihan iuran.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {iuran.map((i) => {
              const isLunas = i.status === "LUNAS";
              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-sm bg-white p-4 shadow-sm ring-1 ring-zinc-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatPeriode(i.periode)}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {isLunas
                        ? `Dibayar ${formatDate(i.tanggalBayar)}`
                        : "Belum dibayar"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-zinc-900">
                      {formatRupiah(i.jumlah)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isLunas
                          ? "bg-green-50 text-green-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {isLunas && <CheckCircle2Icon className="size-3" />}
                      {isLunas ? "Lunas" : "Belum Bayar"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
