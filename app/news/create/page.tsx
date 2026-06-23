import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { Navbar, NewsForm } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Tambah Berita — Paguyupan",
};

export default async function NewsCreatePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "SEKERTARIS") redirect("/news");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Tambah Berita</h1>
          <p className="text-sm text-muted-foreground">Tulis dan publikasikan berita baru.</p>
        </div>
        <NewsForm />
      </main>
    </div>
  );
}
