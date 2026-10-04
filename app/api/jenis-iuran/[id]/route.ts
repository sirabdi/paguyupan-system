import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

const SELECT = {
  id: true,
  nama: true,
  jumlah: true,
  intervalBulan: true,
  isDefault: true,
  aktif: true,
} as const;

const VALID_INTERVAL = [1, 3, 6, 12];

// PUT /api/jenis-iuran/:id — perbarui jenis iuran (hanya Admin komunitas pemilik)
export async function PUT(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const jenisId = Number(id);
  if (!Number.isInteger(jenisId) || jenisId <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const existing = await prisma.jenisIuran.findUnique({
    where: { id: jenisId },
    select: { komunitasId: true, isDefault: true },
  });
  if (!existing || existing.komunitasId !== auth.session.komunitasId) {
    return NextResponse.json({ error: "Jenis iuran tidak ditemukan" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 });
  }
  const { nama, jumlah, intervalBulan, aktif } = (body ?? {}) as Record<string, unknown>;

  const data: Prisma.JenisIuranUpdateInput = {};
  if (typeof nama === "string" && nama.trim()) data.nama = nama.trim();
  if (typeof jumlah === "number" && Number.isFinite(jumlah) && jumlah >= 0) {
    data.jumlah = new Prisma.Decimal(Math.round(jumlah));
  }
  if (typeof aktif === "boolean") data.aktif = aktif;
  // Interval iuran default (bulanan) dikunci ke 1 bulan, tidak bisa diubah
  if (!existing.isDefault && typeof intervalBulan === "number" && VALID_INTERVAL.includes(intervalBulan)) {
    data.intervalBulan = intervalBulan;
  }

  const updated = await prisma.jenisIuran.update({
    where: { id: jenisId },
    data,
    select: SELECT,
  });
  return NextResponse.json(updated);
}

// DELETE /api/jenis-iuran/:id — hapus jenis iuran tambahan (default tidak bisa dihapus)
export async function DELETE(_req: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const jenisId = Number(id);
  if (!Number.isInteger(jenisId) || jenisId <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const existing = await prisma.jenisIuran.findUnique({
    where: { id: jenisId },
    select: { komunitasId: true, isDefault: true },
  });
  if (!existing || existing.komunitasId !== auth.session.komunitasId) {
    return NextResponse.json({ error: "Jenis iuran tidak ditemukan" }, { status: 404 });
  }
  if (existing.isDefault) {
    return NextResponse.json(
      { error: "Iuran bulanan default tidak dapat dihapus" },
      { status: 400 },
    );
  }

  // Cascade menghapus tagihan iuran terkait (onDelete: Cascade di schema)
  await prisma.jenisIuran.delete({ where: { id: jenisId } });
  return new NextResponse(null, { status: 204 });
}
