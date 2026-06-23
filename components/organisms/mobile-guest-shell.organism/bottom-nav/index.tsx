"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HomeIcon, NewspaperIcon, UserIcon, UsersIcon, LayoutDashboardIcon } from "lucide-react";

type Tab = "home" | "news" | "profile";

type Props = {
  active: Tab;
  role: string;
  onChange: (tab: Tab) => void;
};

export function BottomNav({ active, role, onChange }: Props) {
  const router = useRouter();
  const isAdmin = role === "ADMIN";
  const isNewsEditor = role === "ADMIN" || role === "SEKERTARIS";

  return (
    <div className="flex shrink-0 items-center border-t border-zinc-100 bg-white px-2 pb-5 pt-2">
      <NavTab
        active={active === "home"}
        icon={<HomeIcon className="size-5" />}
        label="Beranda"
        onClick={() => onChange("home")}
      />
      <NavTab
        active={active === "news"}
        icon={<NewspaperIcon className="size-5" />}
        label="Berita"
        onClick={() => onChange("news")}
      />
      {isNewsEditor && (
        <NavTab
          active={false}
          icon={<LayoutDashboardIcon className="size-5" />}
          label="Kelola Berita"
          onClick={() => router.push("/news")}
        />
      )}
      {isAdmin && (
        <NavTab
          active={false}
          icon={<UsersIcon className="size-5" />}
          label="Anggota"
          onClick={() => router.push("/anggota")}
        />
      )}
      <NavTab
        active={active === "profile"}
        icon={<UserIcon className="size-5" />}
        label="Profil"
        onClick={() => onChange("profile")}
      />
    </div>
  );
}

function NavTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-colors ${
        active ? "text-zinc-800" : "text-zinc-200 hover:text-zinc-800"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
