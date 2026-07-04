import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireNewsEditor } from "@/lib/auth";
import type { KategoriNews } from "@/modules/news.module";

const VALID_KATEGORI: KategoriNews[] = ["UNDANGAN", "BERITA", "PENGUMUMAN"];

function selectNews(anggotaId: number) {
  return {
    id: true,
    judul: true,
    konten: true,
    bannerUrl: true,
    createdAt: true,
    updatedAt: true,
    penulis: { select: { id: true, nama: true, role: true } },
    _count: {
      select: {
        komentar: { where: { parentId: null } },
        like: true,
      },
    },
    like: {
      where: { anggotaId },
      select: { id: true },
    },
  } as const;
}

function toNewsResponse(n: ReturnType<typeof buildNewsItem>) {
  return n;
}

function buildNewsItem(raw: {
  id: number;
  judul: string;
  konten: string;
  bannerUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  penulis: { id: number; nama: string; role: string };
  _count: { komentar: number; like: number };
  like: { id: number }[];
}) {
  const { like, ...rest } = raw;
  return { ...rest, liked: like.length > 0 };
}

// GET /api/news?q=keyword&page=1  — semua role yang sudah login
// Tanpa page= → semua berita (flat array, backward compat)
// Dengan page= → paginated { data, page, page_size, total, has_more }
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const pageStr = searchParams.get("page");

  const where = q ? { judul: { contains: q } } : {};

  if (pageStr !== null) {
    const page = Math.max(1, Number(pageStr) || 1);
    const pageSize = 5;
    const [rows, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: selectNews(auth.session.anggotaId),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.news.count({ where }),
    ]);
    return NextResponse.json({
      data: rows.map(buildNewsItem),
      page,
      page_size: pageSize,
      total,
      has_more: page * pageSize < total,
    });
  }

  const rows = await prisma.news.findMany({
    where: q ? { judul: { contains: q } } : undefined,
    orderBy: { createdAt: "desc" },
    select: selectNews(auth.session.anggotaId),
  });
  return NextResponse.json(rows.map(buildNewsItem));
}

// POST /api/news  — hanya Admin & Sekertaris
export async function POST(req: Request) {
  const auth = await requireNewsEditor();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON yang valid" },
      { status: 400 },
    );
  }

  const { judul, konten, bannerUrl, kategori } = (body ?? {}) as Record<string, unknown>;

  if (typeof judul !== "string" || judul.trim() === "") {
    return NextResponse.json(
      { error: "Field 'judul' wajib diisi" },
      { status: 400 },
    );
  }
  if (typeof konten !== "string" || konten.trim() === "") {
    return NextResponse.json(
      { error: "Field 'konten' wajib diisi" },
      { status: 400 },
    );
  }

  const row = await prisma.news.create({
    data: {
      judul: judul.trim(),
      konten: konten.trim(),
      bannerUrl: typeof bannerUrl === "string" ? bannerUrl : null,
      kategori: resolvedKategori,
      penulisId: auth.session.anggotaId,
    },
    select: selectNews(auth.session.anggotaId),
  });

  return NextResponse.json(buildNewsItem(row), { status: 201 });
}
