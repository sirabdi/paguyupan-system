import { AnggotaTable } from "@/components/organisms";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anggota — Paguyupan",
  description: "Kelola data anggota paguyupan.",
};

export default function AnggotaPage() {
  return (
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
  );
}
