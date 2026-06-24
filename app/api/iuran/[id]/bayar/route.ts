import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/iuran/:id/bayar — tandai LUNAS, Admin atau Bendahara
export async function PATCH(_req: Request, { params }: RouteContext) {
  const auth = await requireRole("ADMIN", "BENDAHARA");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const iuranId = Number(id);
  if (!Number.isInteger(iuranId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    const iuran = await prisma.iuran.update({
      where: { id: iuranId },
      data: { status: "LUNAS", tanggalBayar: new Date() },
    });

    const periodeLabel = new Date(iuran.periode + "-01").toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
    const jumlahRupiah = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(iuran.jumlah));

    await prisma.notifikasi.createMany({
      data: [{
        anggotaId: iuran.anggotaId,
        tipe: "IURAN_LUNAS" as const,
        judul: "Pembayaran Iuran Dikonfirmasi",
        pesan: `Pembayaran iuran bulan ${periodeLabel} sebesar ${jumlahRupiah} telah dikonfirmasi. Terima kasih.`,
        referensiId: iuran.id,
      }],
      skipDuplicates: true,
    });

    return NextResponse.json(iuran);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }
    throw e;
  }
}
