"use client";

import * as React from "react";
import { ChevronLeft, ClockIcon, NewspaperIcon } from "lucide-react";

import { type News, type KategoriNews, KATEGORI_LABEL } from "@/modules";
import { formatDate, stripHtml } from "@/utils";

const KATEGORI_STYLE: Record<KategoriNews, string> = {
  UNDANGAN: "bg-purple-50 text-purple-600",
  BERITA: "bg-blue-50 text-blue-600",
  PENGUMUMAN: "bg-amber-50 text-amber-600",
};

function KategoriTag({ kategori }: { kategori: KategoriNews }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${KATEGORI_STYLE[kategori]}`}>
      {KATEGORI_LABEL[kategori]}
    </span>
  );
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SEKERTARIS: "Sekertaris",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

export function FeaturedCard({ news }: { news: News }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full overflow-hidden rounded-sm bg-white text-left shadow-sm ring-1 ring-zinc-100"
      >
        {news.bannerUrl ? (
          <img
            src={news.bannerUrl}
            alt={news.judul}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
            <NewspaperIcon className="size-10 text-blue-300" />
          </div>
        )}
        <div className="p-4 flex flex-col gap-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <KategoriTag kategori={news.kategori} />
            <span className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-green-600">
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
            <span>{news.penulis.nama}</span>
          </div>
        </div>
      </button>
      {open && <NewsDetailSheet news={news} onClose={() => setOpen(false)} />}
    </>
  );
}

export function SmallCard({ news }: { news: News }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full gap-3 rounded-sm bg-white text-left shadow-sm ring-1 ring-zinc-100 transition-colors hover:bg-zinc-50"
      >
        {news.bannerUrl ? (
          <img
            src={news.bannerUrl}
            alt={news.judul}
            className="size-24 shrink-0 rounded-l-sm object-cover"
          />
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-blue-100 to-indigo-100">
            <NewspaperIcon className="size-6 text-blue-300" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-3 pr-3">
          <KategoriTag kategori={news.kategori} />
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-900">
            {news.judul}
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span>{news.penulis.nama}</span>
            <span>·</span>
            <span>{formatDate(news.createdAt)}</span>
          </div>
        </div>
      </button>
      {open && <NewsDetailSheet news={news} onClose={() => setOpen(false)} />}
    </>
  );
}

function NewsDetailSheet({
  news,
  onClose,
}: {
  news: News;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-white"
      style={{ borderRadius: "inherit" }}
    >
      <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
        <button
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="truncate text-sm font-semibold text-zinc-800">
          {news.judul}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {news.bannerUrl && (
          <img
            src={news.bannerUrl}
            alt={news.judul}
            className="h-48 w-full object-cover"
          />
        )}
        <div className="px-5 py-4">
          <div className="mb-2">
            <KategoriTag kategori={news.kategori} />
          </div>
          <h2 className="text-lg font-bold leading-snug text-zinc-900">
            {news.judul}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
            <ClockIcon className="size-3" />
            <span>{formatDate(news.createdAt)}</span>
            <span>·</span>
            <span>{news.penulis.nama}</span>
            <span>·</span>
            <span className="text-blue-500">
              {ROLE_LABEL[news.penulis.role] ?? news.penulis.role}
            </span>
          </div>
          <div
            className="mt-4 text-sm leading-relaxed text-zinc-700 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-300 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_img]:mt-3 [&_img]:rounded-sm"
            dangerouslySetInnerHTML={{ __html: news.konten }}
          />
        </div>
      </div>
    </div>
  );
}
