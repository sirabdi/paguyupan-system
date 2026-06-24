import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/anggota/:id — semua role login
export async function GET(_req: Request, { params }: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const anggotaId = Number(id);
  if (!Number.isInteger(anggotaId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const anggota = await prisma.anggota.findUnique({
    where: { id: anggotaId },
    select: {
      id: true, nama: true, alamat: true, noTelp: true,
      email: true, role: true, status: true, tanggalGabung: true,
      createdAt: true, updatedAt: true,
      iuran: { orderBy: { periode: "desc" } },
    },
  });

  if (!anggota) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(anggota);
}

// PUT /api/anggota/:id — hanya Admin
// Body: { nama?, alamat?, noTelp?, email?, status?, role?, password? }
export async function PUT(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const anggotaId = Number(id);
  if (!Number.isInteger(anggotaId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 });
  }
  const { nama, alamat, noTelp, email, status, role, password } =
    (body ?? {}) as Record<string, unknown>;

  const validRoles = ["ADMIN", "BENDAHARA", "ANGGOTA"] as const;

  let passwordHash: string | undefined;
  if (typeof password === "string") {
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }
    const { hash } = await import("bcryptjs");
    passwordHash = await hash(password, 12);
  }

  try {
    const anggota = await prisma.anggota.update({
      where: { id: anggotaId },
      data: {
        ...(typeof nama === "string" ? { nama: nama.trim() } : {}),
        ...(typeof alamat === "string" ? { alamat } : {}),
        ...(typeof noTelp === "string" ? { noTelp } : {}),
        ...(typeof email === "string" ? { email: email.trim().toLowerCase() } : {}),
        ...(status === "AKTIF" || status === "NONAKTIF" ? { status } : {}),
        ...(validRoles.includes(role as never) ? { role: role as (typeof validRoles)[number] } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true, nama: true, email: true, role: true,
        status: true, updatedAt: true,
      },
    });
    return NextResponse.json(anggota);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
      }
      if (e.code === "P2002") {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
      }
    }
    throw e;
  }
}

// DELETE /api/anggota/:id — hanya Admin
export async function DELETE(_req: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const anggotaId = Number(id);
  if (!Number.isInteger(anggotaId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    await prisma.anggota.delete({ where: { id: anggotaId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
    }
    throw e;
  }
}
