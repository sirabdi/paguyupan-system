import type { Metadata } from "next";
import { requirePageSession } from "@/lib/session";
import { NewsTable, MobileShell } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Berita — Paguyupan",
  description: "Daftar berita paguyupan.",
};

export default async function NewsPage() {
  const session = await requirePageSession();

  const canEdit = session.role === "ADMIN" || session.role === "SEKERTARIS";

  return (
    <MobileShell title="Berita" backHref="/guest">
      <NewsTable canEdit={canEdit} />
    </MobileShell>
  );
}
