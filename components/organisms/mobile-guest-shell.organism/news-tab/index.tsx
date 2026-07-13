"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { InboxIcon, MapPinIcon } from "lucide-react";

import {
  fetchNewsPaginated,
  NEWS_KEY,
  KATEGORI_LABEL,
  type KategoriNews,
  type Notifikasi,
} from "@/modules";
import { SmallCard, SearchBar, HeaderActions } from "@/components/molecules";
import {
  Badge,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms";
import { useDebounced } from "@/utils";

const FILTER_OPTIONS: { label: string; value: KategoriNews | undefined }[] = [
  { label: "Semua", value: undefined },
  { label: KATEGORI_LABEL.BERITA, value: "BERITA" },
  { label: KATEGORI_LABEL.PENGUMUMAN, value: "PENGUMUMAN" },
  { label: KATEGORI_LABEL.UNDANGAN, value: "UNDANGAN" },
];

type Props = {
  role: string;
  komunitasNama: string | null;
  onNotifClick: (notif: Notifikasi) => void;
};

export function NewsTab({ role, komunitasNama, onNotifClick }: Props) {
  const [q, setQ] = React.useState("");
  const [kategori, setKategori] = React.useState<KategoriNews | undefined>(
    undefined,
  );
  const debouncedQ = useDebounced(q, 300);

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: [...NEWS_KEY, "paginated", debouncedQ, kategori],
      queryFn: ({ pageParam }) =>
        fetchNewsPaginated({ q: debouncedQ, page: pageParam, kategori }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.has_more ? lastPage.page + 1 : undefined,
    });

  const allNews = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-zinc-900">Semua Berita</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="shrink-0 text-xs text-zinc-400">
                {isPending ? "Memuat…" : `${total} artikel tersedia`}
              </p>
              {komunitasNama && (
                <Badge variant="secondary" className="max-w-[140px] gap-1">
                  <MapPinIcon className="size-3 shrink-0" />
                  <span className="truncate">{komunitasNama}</span>
                </Badge>
              )}
            </div>
          </div>
          <HeaderActions role={role} onNotifClick={onNotifClick} />
        </div>

        <div className="mt-4 flex gap-2">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Cari berita…"
            className="flex-1 rounded-sm"
          />
          <Select
            value={kategori ?? "SEMUA"}
            onValueChange={(v) =>
              setKategori(v === "SEMUA" ? undefined : (v as KategoriNews))
            }
          >
            <SelectTrigger className="data-[size=default]:!h-9 w-36 shrink-0">
              <SelectValue>
                {
                  FILTER_OPTIONS.find(
                    (o) => (o.value ?? "SEMUA") === (kategori ?? "SEMUA"),
                  )?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value ?? "SEMUA"}
                  value={opt.value ?? "SEMUA"}
                  label={opt.label}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-400">
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
