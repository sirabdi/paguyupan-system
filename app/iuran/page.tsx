import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { IuranTable } from "@/components/organisms";
import { Navbar } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Iuran — Paguyupan",
  description: "Kelola data iuran anggota paguyupan.",
};

const ALLOWED_ROLES = ["ADMIN", "BENDAHARA"] as const;

export default async function IuranPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.role as (typeof ALLOWED_ROLES)[number])) {
    redirect("/guest");
  }

  const canBayar = session.role === "ADMIN" || session.role === "BENDAHARA";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Iuran Anggota
          </h1>
          <p className="text-sm text-muted-foreground">
            {canBayar
              ? "Pantau dan catat pembayaran iuran anggota per periode."
              : "Pantau status iuran anggota per periode."}
          </p>
        </div>
        <IuranTable canBayar={canBayar} />
      </main>
    </div>
  );
}
