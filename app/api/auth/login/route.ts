import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

// POST /api/auth/login
// Body: { email, password }
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }

  const anggota = await prisma.anggota.findUnique({ where: { email } });

  // Pesan error yang sama untuk email tidak ditemukan & password salah (hindari user enumeration)
  const invalidMsg = { error: "Email atau password salah" };

  if (!anggota || !anggota.passwordHash) {
    return NextResponse.json(invalidMsg, { status: 401 });
  }

  if (anggota.status === "NONAKTIF") {
    return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, anggota.passwordHash);
  if (!valid) {
    return NextResponse.json(invalidMsg, { status: 401 });
  }

  await createSession({ anggotaId: anggota.id, role: anggota.role });

  return NextResponse.json({
    id: anggota.id,
    nama: anggota.nama,
    email: anggota.email,
    role: anggota.role,
  });
}
