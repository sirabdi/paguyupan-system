import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireNewsEditor } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

function selectNews(anggotaId: number) {
  return {
    id: true,
    judul: true,
    konten: true,
    bannerUrl: true,
    createdAt: true,
    updatedAt: true,
    penulis: { select: { id: true, nama: true, role: true } },
    _count: { select: { komentar: { where: { parentId: null } }, like: true } },
    like: { where: { anggotaId }, select: { id: true } },
  } as const;
}

// GET /api/news/:id  — semua role yang sudah login
export async function GET(_req: Request, { params }: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const raw = await prisma.news.findUnique({ where: { id: newsId }, select: selectNews(auth.session.anggotaId) });
  if (!raw) return NextResponse.json({ error: "News tidak ditemukan" }, { status: 404 });

  const { like, ...rest } = raw;
  return NextResponse.json({ ...rest, liked: like.length > 0 });
}

// PUT /api/news/:id  — hanya Admin & Sekertaris
export async function PUT(req: Request, { params }: RouteContext) {
  const auth = await requireNewsEditor();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 }); }

  const { judul, konten, bannerUrl } = (body ?? {}) as Record<string, unknown>;

  try {
    const news = await prisma.news.update({
      where: { id: newsId },
      data: {
        ...(typeof judul === "string" && judul.trim() ? { judul: judul.trim() } : {}),
        ...(typeof konten === "string" && konten.trim() ? { konten: konten.trim() } : {}),
        // null eksplisit = hapus banner; string = set banner; undefined = tidak diubah
        ...(bannerUrl === null ? { bannerUrl: null } : typeof bannerUrl === "string" ? { bannerUrl } : {}),
      },
      select: selectNews(auth.session.anggotaId),
    });
    const { like, ...rest } = news;
    return NextResponse.json({ ...rest, liked: like.length > 0 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "News tidak ditemukan" }, { status: 404 });
    }
    throw e;
  }
}

// DELETE /api/news/:id  — hanya Admin & Sekertaris
export async function DELETE(_req: Request, { params }: RouteContext) {
  const auth = await requireNewsEditor();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    await prisma.news.delete({ where: { id: newsId } });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "News tidak ditemukan" }, { status: 404 });
    }
    throw e;
  }
}
