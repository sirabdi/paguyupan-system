import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/iuran?periode=2026-06&status=BELUM_BAYAR
// Daftar tagihan iuran, ikut menyertakan nama anggota.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode");
  const status = searchParams.get("status"); // "BELUM_BAYAR" | "LUNAS"

  const iuran = await prisma.iuran.findMany({
    where: {
      ...(periode ? { periode } : {}),
      ...(status === "BELUM_BAYAR" || status === "LUNAS" ? { status } : {}),
    },
    include: { anggota: { select: { id: true, nama: true } } },
    orderBy: [{ periode: "desc" }, { anggotaId: "asc" }],
  });

  return NextResponse.json(iuran);
}
