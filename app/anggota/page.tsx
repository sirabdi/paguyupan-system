import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageSession } from "@/lib/session";
import { AnggotaTable, MobileShell } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Anggota — Paguyupan",
  description: "Kelola data anggota paguyupan.",
};

export default async function AnggotaPage() {
  const session = await requirePageSession();
  if (session.role !== "ADMIN") redirect("/guest");

  return (
    <MobileShell title="Manajemen Anggota" backHref="/guest">
      <AnggotaTable />
    </MobileShell>
  );
}
