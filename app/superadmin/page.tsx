import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { KomunitasDashboard } from "./_komunitas-dashboard";

export const metadata: Metadata = {
  title: "Superadmin — Paguyupan",
};

export default async function SuperadminPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") redirect("/login");

  const komunitas = await prisma.komunitas.findMany({
    select: {
      id: true,
      nama: true,
      tipe: true,
      kode: true,
      kuotaAnggota: true,
      durasiHari: true,
      status: true,
      expiredAt: true,
      alamatInduk: true,
      _count: { select: { anggota: true } },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = komunitas.map((k) => ({
    ...k,
    expiredAt: k.expiredAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
    updatedAt: k.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">Superadmin Panel</h1>
        <p className="text-xs text-zinc-400">Kelola komunitas yang terdaftar</p>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <KomunitasDashboard initialData={serialized} />
      </main>
    </div>
  );
}
