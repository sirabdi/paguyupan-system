"use client";

import * as React from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { InboxIcon, Loader2Icon } from "lucide-react";

import {
  fetchNewsPaginated,
  fetchNewsById,
  NEWS_KEY,
  type Notifikasi,
} from "@/modules";
import { NewsDetailSheet, SmallCard, SearchBar, HeaderActions } from "@/components/molecules";
import { useDebounced } from "@/utils";

type Props = {
  role: string;
  myAnggotaId: number;
  onNotifClick: (notif: Notifikasi) => void;
  pendingArticleId: number | null;
  onArticleOpened: () => void;
};

export function NewsTab({
  role,
  myAnggotaId,
  onNotifClick,
  pendingArticleId,
  onArticleOpened,
}: Props) {
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebounced(q, 300);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...NEWS_KEY, "paginated", debouncedQ],
    queryFn: ({ pageParam }) => fetchNewsPaginated({ q: debouncedQ, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
  });

  // Fetch artikel spesifik ketika ada notif yang diklik
  const { data: pendingArticle } = useQuery({
    queryKey: [...NEWS_KEY, "detail", pendingArticleId],
    queryFn: () => fetchNewsById(pendingArticleId!),
    enabled: pendingArticleId !== null,
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
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-zinc-200"
              />
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
              <SmallCard key={n.id} news={n} myAnggotaId={myAnggotaId} />
            ))}

            {hasNextPage && (
              <button
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-3 text-sm text-zinc-500 active:bg-zinc-50 disabled:opacity-50"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2Icon size={14} className="animate-spin" />
                    Memuat…
                  </>
                ) : (
                  "Muat lebih banyak"
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auto-open artikel dari klik notifikasi */}
      {pendingArticle && (
        <NewsDetailSheet
          news={pendingArticle}
          myAnggotaId={myAnggotaId}
          autoOpenComments
          onClose={onArticleOpened}
        />
      )}
    </div>
  );
}
