"use client";

import * as React from "react";
import { UserIcon, SearchIcon, InboxIcon } from "lucide-react";

import { type News } from "@/modules";
import { FeaturedCard, SmallCard } from "@/components/molecules";

type Props = {
  firstName: string;
  isPending: boolean;
  isError: boolean;
  filtered: News[];
  featured: News | null;
  rest: News[];
  q: string;
  onQChange: (q: string) => void;
};

export function HomeTab({
  firstName,
  isPending,
  isError,
  filtered,
  featured,
  rest,
  q,
  onQChange,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Hai, {firstName}</p>
            <h1 className="text-xl font-bold text-zinc-900">Berita Terkini</h1>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-zinc-100">
            <UserIcon className="size-4 text-zinc-600" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-sm bg-zinc-100 px-3 py-2.5">
          <SearchIcon className="size-4 shrink-0 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Cari berita…"
            className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
          />
        </div>
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
          <div className="flex flex-col items-center gap-2 py-16 text-center text-zinc-400">
            <p className="text-sm">Gagal memuat berita.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-zinc-400">
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
                  Trending
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
