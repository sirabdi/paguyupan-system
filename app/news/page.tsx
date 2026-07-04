import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { NewsTable, MobileShell } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Berita — Paguyupan",
  description: "Daftar berita paguyupan.",
};

export default async function NewsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canEdit = session.role === "ADMIN" || session.role === "SEKERTARIS";

  return (
    <MobileShell title="Berita" backHref="/guest">
      <NewsTable canEdit={canEdit} />
    </MobileShell>
  );
}
