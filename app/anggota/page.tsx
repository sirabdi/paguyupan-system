import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { AnggotaTable } from "@/components/organisms";
import { Navbar } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Anggota — Paguyupan",
  description: "Kelola data anggota paguyupan.",
};

export default async function AnggotaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/guest");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Manajemen Anggota
          </h1>
          <p className="text-sm text-muted-foreground">
            Tambah, ubah, dan hapus data anggota paguyupan.
          </p>
        </div>
        <AnggotaTable />
      </main>
    </div>
  );
}
