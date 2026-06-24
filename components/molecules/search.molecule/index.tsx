"use client";

import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

// Input pencarian terkontrol dengan ikon. Margin/teks diatur lewat
// `className` & `placeholder` agar bisa dipakai di konteks berbeda.
export function SearchBar({
  value,
  onChange,
  placeholder = "Cari…",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-sm bg-zinc-100 px-3 py-2.5",
        className,
      )}
    >
      <SearchIcon className="size-4 shrink-0 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}
