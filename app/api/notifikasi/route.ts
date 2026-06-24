import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/notifikasi — ambil semua notifikasi milik user yang login
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const notifikasi = await prisma.notifikasi.findMany({
    where: { anggotaId: auth.session.anggotaId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifikasi);
}
