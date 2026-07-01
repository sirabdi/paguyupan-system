import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { IuranTable, MobileShell } from "@/components/organisms";

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
    <MobileShell title="Iuran Anggota" backHref="/guest">
      <IuranTable canBayar={canBayar} />
    </MobileShell>
  );
}
