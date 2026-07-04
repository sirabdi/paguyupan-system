import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/komentar/:id — hapus komentar milik sendiri (atau Admin)
export async function DELETE(_req: Request, { params }: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const komentarId = Number(id);
  if (!Number.isInteger(komentarId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const komentar = await prisma.komentar.findUnique({
    where: { id: komentarId },
    select: { penulisId: true },
  });

  if (!komentar) {
    return NextResponse.json({ error: "Komentar tidak ditemukan" }, { status: 404 });
  }

  const isOwner = komentar.penulisId === auth.session.anggotaId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  await prisma.komentar.delete({ where: { id: komentarId } });
  return new NextResponse(null, { status: 204 });
}
