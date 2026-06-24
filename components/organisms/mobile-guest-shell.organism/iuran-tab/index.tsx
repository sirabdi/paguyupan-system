"use client";

import { CheckCircle2Icon, WalletIcon } from "lucide-react";

import { formatDate, formatPeriode, formatRupiah } from "@/utils";
import type { IuranItem } from "../index";
import { HeaderActions } from "@/components/molecules/header-action.molecule";

export function IuranTab({
  iuran,
  role,
}: {
  iuran: IuranItem[];
  role: string;
}) {
  const lunas = iuran.filter((i) => i.status === "LUNAS").length;
  const belum = iuran.length - lunas;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Iuran Saya</h1>
            <p className="text-xs text-zinc-400">
              {iuran.length} periode · {lunas} lunas · {belum} belum bayar
            </p>
          </div>
          <HeaderActions role={role} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {iuran.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-zinc-400">
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
