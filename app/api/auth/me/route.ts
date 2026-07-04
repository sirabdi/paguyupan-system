import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWithReason } from "@/lib/session";

// GET /api/auth/me — return profil user yang sedang login
export async function GET() {
  const result = await getSessionWithReason();

  if (!result.ok) {
    return NextResponse.json(
      { error: "Tidak terautentikasi", reason: result.reason },
      { status: 401 },
    );
  }

  const anggota = await prisma.anggota.findUnique({
    where: { id: result.session.anggotaId },
    select: { id: true, nama: true, email: true, role: true, status: true },
  });

  if (!anggota) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(anggota);
}
