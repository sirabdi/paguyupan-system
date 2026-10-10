import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { JenisIuranManager, MobileShell } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Konfigurasi Iuran — Paguyupan",
  description: "Kelola jenis iuran komunitas.",
};

export default async function KonfigurasiIuranPage() {
  const session = await requirePageSession();
  // Hanya Admin yang boleh mengatur jenis iuran
  if (session.role !== "ADMIN") redirect("/iuran");

  let maxIuranTambahan = 3;
  if (session.komunitasId !== null) {
    const komunitas = await prisma.komunitas.findUnique({
      where: { id: session.komunitasId },
      select: { maxIuranTambahan: true },
    });
    maxIuranTambahan = komunitas?.maxIuranTambahan ?? 3;
  }

  return (
    <MobileShell title="Konfigurasi Iuran" backHref="/iuran">
      <JenisIuranManager maxIuranTambahan={maxIuranTambahan} />
    </MobileShell>
  );
}
