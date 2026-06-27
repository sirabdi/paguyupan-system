"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  LogOutIcon,
  ChevronRightIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldIcon,
} from "lucide-react";

import { logout } from "@/modules";
import type { ProfileData } from "../index";
import { EmailVerifyRow } from "./email-verify";
import { ChangePasswordRow } from "./change-password";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SEKERTARIS: "Sekertaris",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

function formatTanggal(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Props = {
  role: string;
  profile: ProfileData;
};

type DetailRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string | null;
};

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-800">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export function ProfileTab({ role, profile }: Props) {
  const router = useRouter();
  const [emailVerified, setEmailVerified] = React.useState(
    Boolean(profile.emailVerifiedAt),
  );
  const [passwordChangedAt, setPasswordChangedAt] = React.useState(
    profile.passwordChangedAt,
  );

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white px-5 pb-6 pt-6">
        <div className="mt-2 flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-100">
            <UserIcon className="size-8 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-900">{profile.nama}</p>
            <span className="rounded-sm bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-600">
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-5">
          {/* Informasi */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Informasi
            </p>
            <div className="overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-100 divide-y divide-zinc-100">
              <DetailRow
                icon={<UserIcon className="size-4 text-zinc-500" />}
                label="Nama Lengkap"
                value={profile.nama}
              />
              <EmailVerifyRow
                email={profile.email}
                verified={emailVerified}
                onVerified={() => setEmailVerified(true)}
              />
              <DetailRow
                icon={<PhoneIcon className="size-4 text-zinc-500" />}
                label="No Telp"
                value={profile.noTelp}
              />
              <DetailRow
                icon={<MapPinIcon className="size-4 text-zinc-500" />}
                label="Alamat"
                value={profile.alamat}
              />
              <DetailRow
                icon={<CalendarIcon className="size-4 text-zinc-500" />}
                label="Tanggal Gabung"
                value={formatTanggal(profile.tanggalGabung)}
              />
              <DetailRow
                icon={<ShieldIcon className="size-4 text-zinc-500" />}
                label="Role"
                value={ROLE_LABEL[role] ?? role}
              />
            </div>
          </div>

          {/* Aksi */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Aksi
            </p>
            <div className="overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-100 divide-y divide-zinc-100">
              <ChangePasswordRow
                passwordChangedAt={passwordChangedAt}
                onChanged={() => setPasswordChangedAt(new Date().toISOString())}
              />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-red-50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100">
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
      </div>
    </div>
  );
}
