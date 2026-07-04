import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

async function checkRateLimit(ip: string, email: string): Promise<{ blocked: boolean; retryAfter?: number }> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const [byIp, byEmail] = await Promise.all([
    prisma.loginAttempt.count({ where: { ip, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { email, createdAt: { gte: since } } }),
  ]);

  if (byIp >= MAX_ATTEMPTS || byEmail >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfter: WINDOW_MINUTES * 60 };
  }
  return { blocked: false };
}

async function recordAttempt(ip: string, email: string) {
  await prisma.loginAttempt.create({ data: { ip, email } });
}

async function clearAttempts(ip: string, email: string) {
  await prisma.loginAttempt.deleteMany({ where: { ip, email } });
}

// POST /api/auth/login
export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

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

  const rateLimit = await checkRateLimit(ip, email);
  if (rateLimit.blocked) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan login. Coba lagi dalam ${WINDOW_MINUTES} menit.` },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  const anggota = await prisma.anggota.findUnique({ where: { email } });

  // Pesan error sama untuk email tidak ditemukan & password salah (hindari user enumeration)
  const invalidMsg = { error: "Email atau password salah" };

  if (!anggota || !anggota.passwordHash) {
    await recordAttempt(ip, email);
    return NextResponse.json(invalidMsg, { status: 401 });
  }

  if (anggota.status === "NONAKTIF") {
    return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, anggota.passwordHash);
  if (!valid) {
    await recordAttempt(ip, email);
    return NextResponse.json(invalidMsg, { status: 401 });
  }

  // Login berhasil — hapus attempt history dan buat session baru
  await clearAttempts(ip, email);
  await createSession({ anggotaId: anggota.id, role: anggota.role });

  return NextResponse.json({
    id: anggota.id,
    nama: anggota.nama,
    email: anggota.email,
    role: anggota.role,
  });
}
