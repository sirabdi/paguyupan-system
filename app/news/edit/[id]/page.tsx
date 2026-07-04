import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MobileShell, NewsForm } from "@/components/organisms";
import type { News } from "@/modules";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Edit Berita — Paguyupan",
};

export default async function NewsEditPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "SEKERTARIS")
    redirect("/news");

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId) || newsId <= 0) notFound();

  const raw = await prisma.news.findUnique({
    where: { id: newsId },
    select: {
      id: true,
      judul: true,
      konten: true,
      bannerUrl: true,
      kategori: true,
      createdAt: true,
      updatedAt: true,
      penulis: { select: { id: true, nama: true, role: true } },
    },
  });

  if (!raw) notFound();

  // Serialisasi Date ke string untuk client component
  const news: News = {
    ...raw,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    liked: false,
    _count: { komentar: 0, like: 0 },
  };

  return (
    <MobileShell title="Edit Berita" backHref="/news">
      <NewsForm news={news} />
    </MobileShell>
  );
}
