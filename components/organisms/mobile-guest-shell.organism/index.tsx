"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchNews, NEWS_KEY, type Notifikasi } from "@/modules";
import { HomeTab } from "./home-tab";
import { NewsTab } from "./news-tab";
import { IuranTab } from "./iuran-tab";
import { ProfileTab } from "./profile-tab";
import { BottomNav } from "./bottom-nav";

type Tab = "home" | "news" | "iuran" | "profile";

export type ProfileData = {
  nama: string;
  email: string;
  emailVerifiedAt: string | null;
  passwordChangedAt: string | null;
  alamat: string | null;
  noTelp: string | null;
  tanggalGabung: string | null;
};

export type IuranItem = {
  id: number;
  periode: string; // YYYY-MM
  jumlah: string; // Decimal sebagai string
  status: "BELUM_BAYAR" | "LUNAS";
  tanggalBayar: string | null;
};

type Props = {
  firstName: string;
  role: string;
  myAnggotaId: number;
  profile: ProfileData;
  iuran: IuranItem[];
};

export function MobileGuestShell({
  firstName,
  role,
  myAnggotaId,
  profile,
  iuran,
}: Props) {
  const [tab, setTab] = React.useState<Tab>("home");
  const [q, setQ] = React.useState("");
  const [pendingArticleId, setPendingArticleId] = React.useState<number | null>(null);
  const [pendingKomentarId, setPendingKomentarId] = React.useState<number | null>(null);

  const {
    data: allNews = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: NEWS_KEY,
    queryFn: () => fetchNews(),
  });

  const featured = allNews[0] ?? null;
  const rest = allNews.slice(1, 5);
  const filtered = q.trim()
    ? allNews.filter(
        (n) =>
          n.judul.toLowerCase().includes(q.toLowerCase()) ||
          n.penulis.nama.toLowerCase().includes(q.toLowerCase()),
      )
    : allNews;

  function handleNotifClick(notif: Notifikasi) {
    const articleId = notif.newsId ?? notif.referensiId;
    setTab("news");
    setPendingArticleId(articleId);
    setPendingKomentarId(notif.tipe === "KOMENTAR_BALASAN" ? notif.referensiId : null);
  }

  return (
    <div className="relative flex w-full md:w-97.5 flex-col overflow-hidden bg-zinc-50 h-screen">
      {tab === "home" && (
        <HomeTab
          firstName={firstName}
          role={role}
          myAnggotaId={myAnggotaId}
          isPending={isPending}
          isError={isError}
          filtered={filtered}
          featured={featured}
          rest={rest}
          q={q}
          onQChange={setQ}
          onNotifClick={handleNotifClick}
        />
      )}

      {tab === "news" && (
        <NewsTab
          role={role}
          myAnggotaId={myAnggotaId}
          onNotifClick={handleNotifClick}
          pendingArticleId={pendingArticleId}
          pendingKomentarId={pendingKomentarId}
          onArticleOpened={() => {
            setPendingArticleId(null);
            setPendingKomentarId(null);
          }}
        />
      )}

      {tab === "iuran" && <IuranTab iuran={iuran} role={role} />}

      {tab === "profile" && <ProfileTab role={role} profile={profile} />}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
