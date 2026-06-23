import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/iuran?periode=2026-06&status=BELUM_BAYAR — semua role login
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode");
  const status = searchParams.get("status");

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
