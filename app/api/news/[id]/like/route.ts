import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/news/:id/like — toggle like
export async function POST(_req: Request, { params }: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const existing = await prisma.like.findUnique({
    where: { newsId_anggotaId: { newsId, anggotaId: auth.session.anggotaId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { newsId, anggotaId: auth.session.anggotaId } });
  }

  const count = await prisma.like.count({ where: { newsId } });
  return NextResponse.json({ liked: !existing, count });
}
