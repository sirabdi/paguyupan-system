import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireNewsEditor } from "@/lib/auth";
import type { KategoriNews } from "@/modules/news.module";

const VALID_KATEGORI: KategoriNews[] = ["UNDANGAN", "BERITA", "PENGUMUMAN"];

const SELECT_NEWS = {
  id: true,
  judul: true,
  konten: true,
  bannerUrl: true,
  kategori: true,
  createdAt: true,
  updatedAt: true,
  penulis: { select: { id: true, nama: true, role: true } },
} as const;

// GET /api/news?q=keyword&kategori=BERITA  — semua role yang sudah login
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const kategori = searchParams.get("kategori") as KategoriNews | null;

  const news = await prisma.news.findMany({
    where: {
      ...(q ? { judul: { contains: q } } : {}),
      ...(kategori && VALID_KATEGORI.includes(kategori) ? { kategori } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: SELECT_NEWS,
  });

  return NextResponse.json(news);
}

// POST /api/news  — hanya Admin & Sekertaris
export async function POST(req: Request) {
  const auth = await requireNewsEditor();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 }); }

  const { judul, konten, bannerUrl, kategori } = (body ?? {}) as Record<string, unknown>;

  if (typeof judul !== "string" || judul.trim() === "") {
    return NextResponse.json({ error: "Field 'judul' wajib diisi" }, { status: 400 });
  }
  if (typeof konten !== "string" || konten.trim() === "") {
    return NextResponse.json({ error: "Field 'konten' wajib diisi" }, { status: 400 });
  }

  const resolvedKategori: KategoriNews =
    typeof kategori === "string" && VALID_KATEGORI.includes(kategori as KategoriNews)
      ? (kategori as KategoriNews)
      : "BERITA";

  const news = await prisma.news.create({
    data: {
      judul: judul.trim(),
      konten: konten.trim(),
      bannerUrl: typeof bannerUrl === "string" ? bannerUrl : null,
      kategori: resolvedKategori,
      penulisId: auth.session.anggotaId,
    },
    select: SELECT_NEWS,
  });

  return NextResponse.json(news, { status: 201 });
}
