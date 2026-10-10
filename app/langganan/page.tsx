import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionWithReason } from "@/lib/session";
import { getRingkasanLangganan } from "@/lib/langganan";
import { LanggananView, MobileShell } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Langganan — Paguyupan",
};

// Halaman ini SENGAJA tidak memakai requirePageSession: harus tetap bisa dibuka
// saat langganan komunitas belum dibayar / kedaluwarsa / suspend.
export default async function LanggananPage() {
  const result = await getSessionWithReason();
  if (!result.ok) redirect("/login");

  const { session, akses } = result;
  if (session.role === "SUPERADMIN") redirect("/superadmin");
  if (session.komunitasId === null) redirect("/login");

  const isAdmin = session.role === "ADMIN";
  // Non-admin hanya perlu halaman ini saat langganan tidak aktif
  if (akses.aktif && !isAdmin) redirect("/");

  const data = await getRingkasanLangganan(session.komunitasId, isAdmin);
  if (!data) redirect("/login");

  return (
    <MobileShell title="Langganan" backHref={akses.aktif ? "/" : undefined}>
      <Suspense>
        <LanggananView initialData={data} isAdmin={isAdmin} />
      </Suspense>
    </MobileShell>
  );
}
