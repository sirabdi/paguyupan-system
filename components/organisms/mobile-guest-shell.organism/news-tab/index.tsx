"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { InboxIcon } from "lucide-react";

import {
  fetchNewsPaginated,
  NEWS_KEY,
  KATEGORI_LABEL,
  type KategoriNews,
  type Notifikasi,
} from "@/modules";
import { SmallCard, SearchBar, HeaderActions } from "@/components/molecules";
import { Button } from "@/components/atoms";
import { useDebounced } from "@/utils";

const FILTER_OPTIONS: { label: string; value: KategoriNews | undefined }[] = [
  { label: "Semua", value: undefined },
  { label: KATEGORI_LABEL.BERITA, value: "BERITA" },
  { label: KATEGORI_LABEL.PENGUMUMAN, value: "PENGUMUMAN" },
  { label: KATEGORI_LABEL.UNDANGAN, value: "UNDANGAN" },
];

type Props = {
  role: string;
  onNotifClick: (notif: Notifikasi) => void;
};

export function NewsTab({ role, onNotifClick }: Props) {
  const [q, setQ] = React.useState("");
  const [kategori, setKategori] = React.useState<KategoriNews | undefined>(undefined);
  const debouncedQ = useDebounced(q, 300);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...NEWS_KEY, "paginated", debouncedQ, kategori],
    queryFn: ({ pageParam }) => fetchNewsPaginated({ q: debouncedQ, page: pageParam, kategori }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
  });

  const allNews = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Semua Berita</h1>
            <p className="text-xs text-zinc-400">
              {isPending ? "Memuat…" : `${total} artikel tersedia`}
            </p>
          </div>
          <HeaderActions role={role} onNotifClick={onNotifClick} />
        </div>

        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Cari berita…"
          className="mt-4"
        />

        {/* Filter kategori */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setKategori(opt.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                kategori === opt.value
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-200" />
            ))}
          </div>
        ) : allNews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-zinc-400">
            <InboxIcon className="size-10" />
            <p className="text-sm">
              {q ? "Tidak ada berita yang cocok." : "Belum ada berita."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allNews.map((n) => (
              <SmallCard key={n.id} news={n} />
            ))}

            {hasNextPage && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Memuat…" : "Muat lebih banyak"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
