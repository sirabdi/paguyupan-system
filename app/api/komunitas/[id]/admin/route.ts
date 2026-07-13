import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { SELECT } from "../../route";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/komunitas/:id/admin — buat admin dan mulai hitung durasi
export async function POST(req: Request, { params }: RouteContext) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const komId = Number(id);
  if (!Number.isInteger(komId) || komId <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const komunitas = await prisma.komunitas.findUnique({
    where: { id: komId },
    select: { id: true, durasiHari: true },
  });
  if (!komunitas) {
    return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 }); }

  const { nama, email, password, noTelp, alamat } = (body ?? {}) as Record<string, unknown>;

  if (typeof nama !== "string" || nama.trim() === "") {
    return NextResponse.json({ error: "Field 'nama' wajib diisi" }, { status: 400 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Field 'email' tidak valid" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  const existing = await prisma.anggota.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { komunitasId: true, komunitas: { select: { nama: true } } },
  });
  if (existing) {
    const namaKom = existing.komunitas?.nama ?? "komunitas lain";
    const msg = existing.komunitasId === komId
      ? "Email sudah terdaftar di komunitas ini"
      : `Email sudah terdaftar di komunitas "${namaKom}"`;
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 12);

  // Hitung expiredAt dari durasiHari saat admin pertama ditambahkan
  const expiredAt = komunitas.durasiHari
    ? new Date(Date.now() + komunitas.durasiHari * 24 * 60 * 60 * 1000)
    : null;

  try {
    const [anggota] = await prisma.$transaction([
      prisma.anggota.create({
        data: {
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: "ADMIN",
          noTelp: typeof noTelp === "string" ? noTelp.trim() : undefined,
          alamat: typeof alamat === "string" && alamat.trim() ? alamat.trim() : undefined,
          komunitasId: komId,
        },
        select: { id: true, nama: true, email: true, role: true, createdAt: true },
      }),
      prisma.komunitas.update({
        where: { id: komId },
        data: { status: "AKTIF", expiredAt },
      }),
    ]);
    return NextResponse.json(anggota, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    throw e;
  }
}
