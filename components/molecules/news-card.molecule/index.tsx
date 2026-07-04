"use client";

import Link from "next/link";
import {
  ClockIcon,
  HeartIcon,
  MessageCircleIcon,
  NewspaperIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type News,
  type KategoriNews,
  KATEGORI_LABEL,
  NEWS_KEY,
  toggleLike,
} from "@/modules";
import { formatDate, stripHtml } from "@/utils";

// ─── KategoriTag ──────────────────────────────────────────────────────────────

const KATEGORI_STYLE: Record<KategoriNews, string> = {
  UNDANGAN: "bg-purple-50 text-purple-600",
  BERITA: "bg-blue-50 text-blue-600",
  PENGUMUMAN: "bg-amber-50 text-amber-600",
};

export function KategoriTag({ kategori }: { kategori: KategoriNews }) {
  return (
    <span
      className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${KATEGORI_STYLE[kategori]}`}
    >
      {KATEGORI_LABEL[kategori]}
    </span>
  );
}

// ─── Shared like mutation ─────────────────────────────────────────────────────

function useLikeMutation(newsId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => toggleLike(newsId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NEWS_KEY });
      const prev = queryClient.getQueryData<News[]>(NEWS_KEY);
      queryClient.setQueryData<News[]>(NEWS_KEY, (old) =>
        old?.map((n) =>
          n.id === newsId
            ? {
                ...n,
                liked: !n.liked,
                _count: {
                  ...n._count,
                  like: n._count.like + (n.liked ? -1 : 1),
                },
              }
            : n,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(NEWS_KEY, ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: NEWS_KEY }),
  });
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export function FeaturedCard({ news }: { news: News }) {
  const likeMutation = useLikeMutation(news.id);

  return (
    <div className="w-full overflow-hidden rounded-sm bg-white text-left shadow-sm ring-1 ring-zinc-100">
      <Link href={`/guest/news/${news.id}`} className="block text-left">
        {news.bannerUrl ? (
          <img
            src={news.bannerUrl}
            alt={news.judul}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-linear-to-br from-blue-100 to-indigo-100">
            <NewspaperIcon className="size-10 text-blue-300" />
          </div>
        )}
        <div className="p-4 flex flex-col gap-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <KategoriTag kategori={news.kategori} />
            <span className="inline-block w-fit rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold capitalize tracking-wide text-green-600">
              Paling Baru
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900">
            {news.judul}
          </h3>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ClockIcon className="size-3" />
            <span>{formatDate(news.createdAt)}</span>
            <span>·</span>
            <span className="max-w-36 truncate">{news.penulis.nama}</span>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-4 border-t border-zinc-50 px-4 py-2.5">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          <HeartIcon
            className={`size-3.5 transition-colors ${news.liked ? "fill-red-500 text-red-500" : ""}`}
          />
          <span>{news._count.like} Like</span>
        </button>
        <Link
          href={`/guest/news/${news.id}?comments=1`}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-500 transition-colors"
        >
          <MessageCircleIcon className="size-3.5" />
          <span>{news._count.komentar} Komentar</span>
        </Link>
      </div>
    </div>
  );
}

export function SmallCard({ news }: { news: News }) {
  const likeMutation = useLikeMutation(news.id);

  return (
    <div className="w-full overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-100">
      <Link
        href={`/guest/news/${news.id}`}
        className="flex w-full gap-3 text-left transition-colors hover:bg-zinc-50"
      >
        {news.bannerUrl ? (
          <img
            src={news.bannerUrl}
            alt={news.judul}
            className="size-32 shrink-0 rounded-tl-sm object-cover"
          />
        ) : (
          <div className="flex size-32 shrink-0 items-center justify-center bg-linear-to-br from-blue-100 to-indigo-100">
            <NewspaperIcon className="size-6 text-blue-300" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-3 pr-3">
          <KategoriTag kategori={news.kategori} />
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-900">
            {news.judul}
          </h3>
          <p className="line-clamp-1 text-[11px] text-zinc-400">
            {stripHtml(news.konten)}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="max-w-24 truncate">{news.penulis.nama}</span>
            <span>·</span>
            <span>{formatDate(news.createdAt)}</span>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-4 border-t border-zinc-50 px-3 py-2">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          <HeartIcon
            className={`size-3.5 ${news.liked ? "fill-red-500 text-red-500" : ""}`}
          />
          <span>{news._count.like} Like</span>
        </button>
        <Link
          href={`/guest/news/${news.id}?comments=1`}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-500 transition-colors"
        >
          <MessageCircleIcon className="size-3" />
          <span>{news._count.komentar} Komentar</span>
        </Link>
      </div>
    </div>
  );
}
