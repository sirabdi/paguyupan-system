"use client";

import { useRouter } from "next/navigation";
import { UserIcon, LogOutIcon, ChevronRightIcon } from "lucide-react";

import { logout } from "@/modules";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SEKERTARIS: "Sekertaris",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

type Props = {
  firstName: string;
  role: string;
};

export function ProfileTab({ firstName, role }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="bg-white px-5 pb-6 pt-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-100">
            <UserIcon className="size-8 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-900">{firstName}</p>
            <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-600">
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Aksi
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-sm bg-white px-4 py-3.5 text-left shadow-sm ring-1 ring-zinc-100 transition-colors hover:bg-red-50"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-red-100">
              <LogOutIcon className="size-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">Keluar</p>
              <p className="text-xs text-zinc-400">Akhiri sesi ini</p>
            </div>
            <ChevronRightIcon className="size-4 text-zinc-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
