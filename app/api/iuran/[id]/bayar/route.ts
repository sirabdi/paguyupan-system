import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/iuran/:id/bayar — tandai LUNAS, hanya Admin
export async function PATCH(_req: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
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
    return NextResponse.json(iuran);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }
    throw e;
  }
}
