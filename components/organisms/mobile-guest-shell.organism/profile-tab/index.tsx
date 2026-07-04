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
  ShieldCheckIcon,
} from "lucide-react";

import { logout } from "@/modules";
import type { ProfileData } from "../index";
import { EmailVerifyRow } from "./email-verify";
import { ChangePasswordRow } from "./change-password";
import { ROLE_LABEL, formatDateLong } from "@/utils";

type Props = {
  role: string;
  profile: ProfileData;
};

type DetailRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string | null;
};

function AccountVerifiedBadge({
  emailVerified,
  passwordChanged,
}: {
  emailVerified: boolean;
  passwordChanged: boolean;
}) {
  const points = [emailVerified, passwordChanged].filter(Boolean).length;
  const pct = points * 50;
  const fully = pct === 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {fully ? (
        <div className="flex items-center gap-1.5">
          <ShieldCheckIcon className="size-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">
            Verified Account
          </span>
        </div>
      ) : (
        <span className="text-xs font-semibold text-amber-700">
          {pct}% Account Verified
        </span>
      )}

      <div className="flex flex-col items-center gap-0.5">
        {/* Progress bar */}
        <div className="flex w-64 gap-1">
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${emailVerified ? "bg-emerald-400" : "bg-zinc-200"}`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${passwordChanged ? "bg-emerald-400" : "bg-zinc-200"}`}
          />
        </div>

        {/* Checklist breakdown */}
        <div className="flex w-64 gap-1">
          <div className="flex justify-center w-32 gap-1">
            <p
              className={`text-[10px] ${emailVerified ? "text-emerald-600" : "text-zinc-400"}`}
            >
              Email
            </p>
          </div>
          <div className="flex justify-center w-32 gap-1">
            <p
              className={`text-[10px] ${passwordChanged ? "text-emerald-600" : "text-zinc-400"}`}
            >
              Password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="bg-white p-5">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-100">
            <UserIcon className="size-8 text-blue-600" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-bold text-zinc-900">{profile.nama}</p>
            <AccountVerifiedBadge
              emailVerified={emailVerified}
              passwordChanged={Boolean(passwordChangedAt)}
            />
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
                value={formatDateLong(profile.tanggalGabung)}
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
