import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/iuran/:id/bayar — tandai tagihan sebagai LUNAS
export async function PATCH(_req: Request, { params }: RouteContext) {
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
