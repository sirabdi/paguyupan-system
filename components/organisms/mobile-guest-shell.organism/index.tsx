"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchNews, NEWS_KEY } from "@/modules";
import { HomeTab } from "./home-tab";
import { NewsTab } from "./news-tab";
import { ProfileTab } from "./profile-tab";
import { BottomNav } from "./bottom-nav";

type Tab = "home" | "news" | "profile";

type Props = {
  firstName: string;
  role: string;
};

export function MobileGuestShell({ firstName, role }: Props) {
  const [tab, setTab] = React.useState<Tab>("home");
  const [q, setQ] = React.useState("");

  const {
    data: allNews = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: NEWS_KEY,
    queryFn: () => fetchNews(),
  });

  const featured = allNews[0] ?? null;
  const rest = allNews.slice(1);
  const filtered = q.trim()
    ? allNews.filter(
        (n) =>
          n.judul.toLowerCase().includes(q.toLowerCase()) ||
          n.penulis.nama.toLowerCase().includes(q.toLowerCase()),
      )
    : allNews;

  return (
    <div
      className="relative flex w-full max-w-[390px] flex-col overflow-hidden bg-zinc-50 shadow-2xl"
      style={{ height: "100dvh", maxHeight: 820 }}
    >
      {tab === "home" && (
        <HomeTab
          firstName={firstName}
          isPending={isPending}
          isError={isError}
          filtered={filtered}
          featured={featured}
          rest={rest}
          q={q}
          onQChange={setQ}
        />
      )}

      {tab === "news" && <NewsTab />}

      {tab === "profile" && <ProfileTab firstName={firstName} role={role} />}

      <BottomNav active={tab} role={role} onChange={setTab} />
    </div>
  );
}
