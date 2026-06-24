import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PATCH /api/notifikasi/baca-semua — tandai semua notifikasi user sebagai dibaca
export async function PATCH() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { count } = await prisma.notifikasi.updateMany({
    where: { anggotaId: auth.session.anggotaId, dibaca: false },
    data: { dibaca: true },
  });

  return NextResponse.json({ updated: count });
}
