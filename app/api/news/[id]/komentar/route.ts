import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

const SELECT_PENULIS = { id: true, nama: true, role: true } as const;

// GET /api/news/:id/komentar — ambil root komentar + replies
export async function GET(_req: Request, { params }: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const komentar = await prisma.komentar.findMany({
    where: { newsId, parentId: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      konten: true,
      createdAt: true,
      penulis: { select: SELECT_PENULIS },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          konten: true,
          createdAt: true,
          penulis: { select: SELECT_PENULIS },
        },
      },
    },
  });

  return NextResponse.json(komentar);
}

// POST /api/news/:id/komentar — tambah komentar atau reply
// Body: { konten: string, parentId?: number }
export async function POST(req: Request, { params }: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 });
  }

  const { konten, parentId } = (body ?? {}) as Record<string, unknown>;

  if (typeof konten !== "string" || konten.trim() === "") {
    return NextResponse.json({ error: "Komentar tidak boleh kosong" }, { status: 400 });
  }

  // Validasi parentId: harus root komentar (bukan reply)
  if (parentId !== undefined && parentId !== null) {
    if (typeof parentId !== "number") {
      return NextResponse.json({ error: "parentId tidak valid" }, { status: 400 });
    }
    const parent = await prisma.komentar.findUnique({
      where: { id: parentId },
      select: { parentId: true, newsId: true },
    });
    if (!parent || parent.newsId !== newsId) {
      return NextResponse.json({ error: "Komentar induk tidak ditemukan" }, { status: 404 });
    }
    if (parent.parentId !== null) {
      return NextResponse.json({ error: "Tidak bisa membalas balasan" }, { status: 400 });
    }
  }

  const komentar = await prisma.komentar.create({
    data: {
      newsId,
      penulisId: auth.session.anggotaId,
      konten: konten.trim(),
      parentId: typeof parentId === "number" ? parentId : null,
    },
    select: {
      id: true,
      konten: true,
      createdAt: true,
      penulis: { select: SELECT_PENULIS },
    },
  });

  return NextResponse.json(komentar, { status: 201 });
}
