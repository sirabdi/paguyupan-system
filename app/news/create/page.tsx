import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageSession } from "@/lib/session";
import { MobileShell, NewsForm } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Tambah Berita — Paguyupan",
};

export default async function NewsCreatePage() {
  const session = await requirePageSession();
  if (session.role !== "ADMIN" && session.role !== "SEKERTARIS")
    redirect("/news");

  return (
    <MobileShell title="Tambah Berita" backHref="/news">
      <NewsForm />
    </MobileShell>
  );
}
