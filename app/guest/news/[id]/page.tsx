import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { MobileShell, NewsDetailView } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Berita — Paguyupan",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comments?: string; komentar?: string }>;
};

export default async function GuestNewsDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId) || newsId <= 0) notFound();

  const sp = await searchParams;
  const pendingKomentarId = sp.komentar ? Number(sp.komentar) : null;
  const openComments = sp.comments !== undefined || sp.komentar !== undefined;

  return (
    <MobileShell>
      <NewsDetailView
        newsId={newsId}
        myAnggotaId={session.anggotaId}
        openComments={openComments}
        pendingKomentarId={
          pendingKomentarId && Number.isInteger(pendingKomentarId)
            ? pendingKomentarId
            : null
        }
      />
    </MobileShell>
  );
}
