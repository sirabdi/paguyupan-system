import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { Navbar } from "@/components/organisms";
import { NewsTable } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Berita — Paguyupan",
  description: "Daftar berita paguyupan.",
};

export default async function NewsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canEdit = session.role === "ADMIN" || session.role === "SEKERTARIS";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Berita</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "Kelola dan publikasikan berita paguyupan."
              : "Daftar berita terkini paguyupan."}
          </p>
        </div>
        <NewsTable canEdit={canEdit} />
      </main>
    </div>
  );
}
