import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";

const SELECT = {
  id: true,
  nama: true,
  jumlah: true,
  intervalBulan: true,
  isDefault: true,
  aktif: true,
} as const;

const VALID_INTERVAL = [1, 3, 6, 12];

// GET /api/jenis-iuran — daftar jenis iuran komunitas milik user (semua role login)
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const komunitasId = auth.session.komunitasId;
  if (komunitasId === null) {
    // SUPERADMIN tidak terikat komunitas
    return NextResponse.json([]);
  }

  const data = await prisma.jenisIuran.findMany({
    where: { komunitasId },
    select: SELECT,
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(data);
}

// POST /api/jenis-iuran — buat jenis iuran tambahan (hanya Admin komunitas)
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const komunitasId = auth.session.komunitasId;
  if (komunitasId === null) {
    return NextResponse.json({ error: "Admin tidak terikat komunitas" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 });
  }

  const { nama, jumlah, intervalBulan } = (body ?? {}) as Record<string, unknown>;

  if (typeof nama !== "string" || nama.trim() === "") {
    return NextResponse.json({ error: "Nama iuran wajib diisi" }, { status: 400 });
  }
  if (typeof jumlah !== "number" || !Number.isFinite(jumlah) || jumlah < 0) {
    return NextResponse.json({ error: "Nominal iuran tidak valid" }, { status: 400 });
  }
  if (typeof intervalBulan !== "number" || !VALID_INTERVAL.includes(intervalBulan)) {
    return NextResponse.json({ error: "Interval tidak valid" }, { status: 400 });
  }

  // Cek kuota: jumlah jenis iuran TAMBAHAN (isDefault=false) tidak boleh lebih dari maxIuranTambahan
  const komunitas = await prisma.komunitas.findUnique({
    where: { id: komunitasId },
    select: { maxIuranTambahan: true },
  });
  if (!komunitas) {
    return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });
  }

  const currentCount = await prisma.jenisIuran.count({
    where: { komunitasId, isDefault: false },
  });
  if (currentCount >= komunitas.maxIuranTambahan) {
    return NextResponse.json(
      {
        error: `Kuota jenis iuran tambahan penuh (maksimal ${komunitas.maxIuranTambahan}). Hubungi superadmin untuk menambah kuota.`,
      },
      { status: 409 },
    );
  }

  const created = await prisma.jenisIuran.create({
    data: {
      komunitasId,
      nama: nama.trim(),
      jumlah: new Prisma.Decimal(Math.round(jumlah)),
      intervalBulan,
      isDefault: false,
    },
    select: SELECT,
  });
  return NextResponse.json(created, { status: 201 });
}
