import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MobileGuestShell } from "@/components/organisms";

export const metadata: Metadata = {
  title: "Beranda — Paguyupan",
};

export default async function GuestPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const anggota = await prisma.anggota.findUnique({
    where: { id: session.anggotaId },
    select: { nama: true },
  });

  const firstName = anggota?.nama.split(" ")[0] ?? "Anggota";

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-zinc-100">
      <MobileGuestShell firstName={firstName} role={session.role} />
    </div>
  );
}
