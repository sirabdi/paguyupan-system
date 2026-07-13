"use client";

import { InboxIcon, MapPinIcon } from "lucide-react";
import { Badge } from "@/components/atoms";

import { type News, type Notifikasi } from "@/modules";
import {
  FeaturedCard,
  SmallCard,
  SearchBar,
  HeaderActions,
} from "@/components/molecules";

type Props = {
  firstName: string;
  role: string;
  komunitasNama: string | null;
  isPending: boolean;
  isError: boolean;
  filtered: News[];
  featured: News | null;
  rest: News[];
  q: string;
  onQChange: (q: string) => void;
  onNotifClick: (notif: Notifikasi) => void;
};

export function HomeTab({
  firstName,
  role,
  komunitasNama,
  isPending,
  isError,
  filtered,
  featured,
  rest,
  q,
  onQChange,
  onNotifClick,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Berita Terkini</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-zinc-400">Hai, {firstName}</p>
              {komunitasNama && (
                <Badge variant="secondary" className="gap-1">
                  <MapPinIcon className="size-3 shrink-0" />
                  <span className="truncate">{komunitasNama}</span>
                </Badge>
              )}
            </div>
          </div>
          <HeaderActions role={role} onNotifClick={onNotifClick} />
        </div>

        <SearchBar
          value={q}
          onChange={onQChange}
          placeholder="Cari berita…"
          className="mt-4"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-zinc-200"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-zinc-400">
            <p className="text-sm">Gagal memuat berita.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-400">
            <InboxIcon className="size-10" />
            <p className="text-sm">
              {q ? "Tidak ada berita yang cocok." : "Belum ada berita."}
            </p>
          </div>
        ) : (
          <>
            {!q && featured && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Paling Baru
                </p>
                <FeaturedCard news={featured} />
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {q ? `Hasil pencarian (${filtered.length})` : "Untuk Kamu"}
              </p>
              <div className="flex flex-col gap-3">
                {(q ? filtered : rest).map((n) => (
                  <SmallCard key={n.id} news={n} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
