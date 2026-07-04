import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, ClockIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/utils";
import { KATEGORI_LABEL, type KategoriNews } from "@/modules";
import { ShareButton } from "./_share-button";

type PageProps = { params: Promise<{ id: string }> };

const KATEGORI_STYLE: Record<KategoriNews, string> = {
  UNDANGAN: "bg-purple-50 text-purple-600",
  BERITA: "bg-blue-50 text-blue-600",
  PENGUMUMAN: "bg-amber-50 text-amber-600",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SEKERTARIS: "Sekertaris",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId) || newsId <= 0) return {};

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    select: { judul: true },
  });

  return { title: news ? `${news.judul} — Paguyupan` : "Berita — Paguyupan" };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId) || newsId <= 0) notFound();

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    select: {
      id: true,
      judul: true,
      konten: true,
      bannerUrl: true,
      kategori: true,
      createdAt: true,
      penulis: { select: { nama: true, role: true } },
    },
  });

  if (!news) notFound();

  const backHref = "/";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
        <Link
          href={backHref}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali
        </Link>
        <ShareButton title={news.judul} newsId={news.id} />
      </div>

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        {/* Banner */}
        {news.bannerUrl && (
          <img
            src={news.bannerUrl}
            alt={news.judul}
            className="mb-6 h-56 w-full rounded-xl object-cover sm:h-72"
          />
        )}

        {/* Kategori */}
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${KATEGORI_STYLE[news.kategori]}`}
        >
          {KATEGORI_LABEL[news.kategori]}
        </span>

        {/* Judul */}
        <h1 className="mt-3 text-xl font-bold leading-snug text-zinc-900 sm:text-2xl">
          {news.judul}
        </h1>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <ClockIcon className="size-3" />
          <span>{formatDate(news.createdAt.toISOString())}</span>
          <span>·</span>
          <span>{news.penulis.nama}</span>
          <span>·</span>
          <span className="text-blue-500">
            {ROLE_LABEL[news.penulis.role] ?? news.penulis.role}
          </span>
        </div>

        {/* Konten */}
        <div
          className="prose prose-sm mt-6 max-w-none text-zinc-700 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-300 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: news.konten }}
        />
      </main>
    </div>
  );
}
