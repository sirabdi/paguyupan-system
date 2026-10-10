import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const SELECT = {
  id: true,
  nama: true,
  tipe: true,
  paket: true,
  kuotaAnggota: true,
  status: true,
  expiredAt: true,
  alamatInduk: true,
  maxIuranTambahan: true,
  _count: { select: { anggota: true } },
  createdAt: true,
  updatedAt: true,
} as const;

// GET /api/komunitas — daftar semua komunitas (Superadmin).
// Komunitas dibuat lewat pendaftaran mandiri (/api/daftar), bukan dari sini.
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const data = await prisma.komunitas.findMany({
    select: SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(data);
}
