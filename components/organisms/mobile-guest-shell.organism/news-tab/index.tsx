"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchNews, NEWS_KEY } from "@/modules";
import { SmallCard } from "@/components/molecules";

export function NewsTab() {
  const { data: allNews = [], isPending } = useQuery({
    queryKey: NEWS_KEY,
    queryFn: () => fetchNews(),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <h1 className="text-xl font-bold text-zinc-900">Semua Berita</h1>
        <p className="text-xs text-zinc-400">
          {allNews.length} artikel tersedia
        </p>
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
        ) : (
          <div className="flex flex-col gap-3">
            {allNews.map((n) => (
              <SmallCard key={n.id} news={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
