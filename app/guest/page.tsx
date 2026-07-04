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
    select: { nama: true, email: true, emailVerifiedAt: true, passwordChangedAt: true, alamat: true, noTelp: true, tanggalGabung: true },
  });

  const iuran = await prisma.iuran.findMany({
    where: { anggotaId: session.anggotaId },
    orderBy: { periode: "desc" },
    select: { id: true, periode: true, jumlah: true, status: true, tanggalBayar: true },
  });

  const firstName = anggota?.nama.split(" ")[0] ?? "Anggota";

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-zinc-100">
      <MobileGuestShell
        firstName={firstName}
        role={session.role}
        myAnggotaId={session.anggotaId}
        profile={{
          nama: anggota?.nama ?? "-",
          email: anggota?.email ?? "-",
          emailVerifiedAt: anggota?.emailVerifiedAt?.toISOString() ?? null,
          passwordChangedAt: anggota?.passwordChangedAt?.toISOString() ?? null,
          alamat: anggota?.alamat ?? null,
          noTelp: anggota?.noTelp ?? null,
          tanggalGabung: anggota?.tanggalGabung?.toISOString() ?? null,
        }}
        iuran={iuran.map((i) => ({
          id: i.id,
          periode: i.periode,
          jumlah: i.jumlah.toString(),
          status: i.status,
          tanggalBayar: i.tanggalBayar?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
