import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { MobileShell, NewsForm } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Tambah Berita — Paguyupan",
};

export default async function NewsCreatePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "SEKERTARIS")
    redirect("/news");

  return (
    <MobileShell title="Tambah Berita" backHref="/news">
      <NewsForm />
    </MobileShell>
  );
}
