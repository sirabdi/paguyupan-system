import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/auth/me — return profil user yang sedang login
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const anggota = await prisma.anggota.findUnique({
    where: { id: auth.session.anggotaId },
    select: { id: true, nama: true, email: true, role: true, status: true },
  });

  if (!anggota) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(anggota);
}
