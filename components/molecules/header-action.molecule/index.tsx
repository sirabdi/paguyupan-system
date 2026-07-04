"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  MessageCircleReplyIcon,
  ReceiptIcon,
  SlidersHorizontal,
  UsersIcon,
  NewspaperIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";

import {
  NOTIF_KEY,
  bacaSemua,
  fetchNotifikasi,
  type Notifikasi,
  type TipeNotif,
} from "@/modules";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  ADMIN: [
    { label: "Anggota", href: "/anggota", icon: UsersIcon },
    { label: "Berita", href: "/news", icon: NewspaperIcon },
    { label: "Iuran", href: "/iuran", icon: WalletIcon },
  ],
  SEKERTARIS: [{ label: "Berita", href: "/news", icon: NewspaperIcon }],
  BENDAHARA: [{ label: "Iuran", href: "/iuran", icon: WalletIcon }],
};

const TIPE_ICON: Record<TipeNotif, React.ReactNode> = {
  IURAN_TAGIHAN: <ReceiptIcon className="size-4 text-amber-600" />,
  IURAN_LUNAS: <WalletIcon className="size-4 text-green-600" />,
  KOMENTAR_ARTIKEL: <MessageCircleIcon className="size-4 text-blue-600" />,
  KOMENTAR_BALASAN: <MessageCircleReplyIcon className="size-4 text-violet-600" />,
};

const TIPE_BG: Record<TipeNotif, string> = {
  IURAN_TAGIHAN: "bg-amber-50",
  IURAN_LUNAS: "bg-green-50",
  KOMENTAR_ARTIKEL: "bg-blue-50",
  KOMENTAR_BALASAN: "bg-violet-50",
};

const KOMENTAR_TIPES: TipeNotif[] = ["KOMENTAR_ARTIKEL", "KOMENTAR_BALASAN"];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

type Props = {
  role: string;
  onNotifClick?: (notif: Notifikasi) => void;
};

export function HeaderActions({ role, onNotifClick }: Props) {
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [bellOpen, setBellOpen] = React.useState(false);
  const menu = MENU_BY_ROLE[role] ?? [];

  const { data: notifikasi = [] } = useQuery({
    queryKey: [...NOTIF_KEY],
    queryFn: fetchNotifikasi,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const bacaMutation = useMutation({
    mutationFn: bacaSemua,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIF_KEY }),
  });

  const unread = notifikasi.filter((n) => !n.dibaca).length;

  function openBell() {
    setBellOpen(true);
    queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
    if (unread > 0) bacaMutation.mutate();
  }

  function handleNotifClick(notif: Notifikasi) {
    if (KOMENTAR_TIPES.includes(notif.tipe)) {
      setBellOpen(false);
      onNotifClick?.(notif);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {menu.length > 0 && (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu kelola"
            className="cursor-pointer flex size-9 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200"
          >
            <SlidersHorizontal className="size-4 text-zinc-600" />
          </button>
        )}

        {/* Bell dengan badge */}
        <button
          type="button"
          onClick={openBell}
          aria-label="Notifikasi"
          className="relative cursor-pointer flex size-9 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200"
        >
          <BellIcon className="size-4 text-zinc-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>

      {/* Panel menu kelola */}
      {menuOpen && (
        <div className="absolute inset-0 z-50 animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute right-0 top-0 flex h-full w-3/4 max-w-70 flex-col bg-white shadow-xl animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <span className="text-sm font-semibold text-zinc-800">
                Kelola
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup"
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-2">
              {menu.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-sm px-3 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                    <Icon className="size-4 text-zinc-500" />
                  </span>
                  <span className="flex-1 font-medium">{label}</span>
                  <ChevronRightIcon className="size-4 text-zinc-300" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Panel notifikasi */}
      {bellOpen && (
        <div className="absolute inset-0 z-50 animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setBellOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[320px] flex-col bg-white shadow-xl animate-in slide-in-from-right-4 duration-200">
            {/* Header panel */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-800">
                  Notifikasi
                </span>
                {unread > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                    {unread}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBellOpen(false)}
                aria-label="Tutup"
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifikasi.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-zinc-400">
                  <BellIcon className="size-8 opacity-30" />
                  <p className="text-sm">Belum ada notifikasi</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {notifikasi.map((n) => (
                    <NotifItem
                      key={n.id}
                      notif={n}
                      onClick={
                        KOMENTAR_TIPES.includes(n.tipe)
                          ? () => handleNotifClick(n)
                          : undefined
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotifItem({
  notif,
  onClick,
}: {
  notif: Notifikasi;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${TIPE_BG[notif.tipe]}`}
      >
        {TIPE_ICON[notif.tipe]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="text-xs font-semibold text-zinc-800 leading-snug">
            {notif.judul}
          </p>
          {!notif.dibaca && (
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
          {notif.pesan}
        </p>
        <p className="mt-1 text-[10px] text-zinc-400">
          {timeAgo(notif.createdAt)}
        </p>
        {onClick && (
          <p className="mt-1 text-[10px] font-medium text-blue-500">
            Ketuk untuk melihat artikel →
          </p>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <li>
        <button
          type="button"
          onClick={onClick}
          className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 ${!notif.dibaca ? "bg-blue-50/50" : ""}`}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className={`flex gap-3 px-4 py-3.5 ${!notif.dibaca ? "bg-blue-50/50" : ""}`}>
      {content}
    </li>
  );
}
