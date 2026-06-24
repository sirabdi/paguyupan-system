"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { InboxIcon } from "lucide-react";

import { fetchNews, NEWS_KEY } from "@/modules";
import { SmallCard, SearchBar, HeaderActions } from "@/components/molecules";

export function NewsTab({ role }: { role: string }) {
  const { data: allNews = [], isPending } = useQuery({
    queryKey: NEWS_KEY,
    queryFn: () => fetchNews(),
  });

  const [q, setQ] = React.useState("");
  const filtered = q.trim()
    ? allNews.filter(
        (n) =>
          n.judul.toLowerCase().includes(q.toLowerCase()) ||
          n.penulis.nama.toLowerCase().includes(q.toLowerCase()),
      )
    : allNews;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Semua Berita</h1>
            <p className="text-xs text-zinc-400">
              {allNews.length} artikel tersedia
            </p>
          </div>
          <HeaderActions role={role} />
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-zinc-400">
            <InboxIcon className="size-10" />
            <p className="text-sm">
              {q ? "Tidak ada berita yang cocok." : "Belum ada berita."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((n) => (
              <SmallCard key={n.id} news={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
