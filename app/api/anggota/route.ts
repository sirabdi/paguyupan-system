import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth";

// GET /api/anggota?status=AKTIF&q=budi
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const anggota = await prisma.anggota.findMany({
    where: {
      ...(status === "AKTIF" || status === "NONAKTIF" ? { status } : {}),
      ...(q ? { nama: { contains: q } } : {}),
    },
    select: {
      id: true, nama: true, alamat: true, noTelp: true,
      email: true, role: true, status: true, tanggalGabung: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: { nama: "asc" },
  });

  return NextResponse.json(anggota);
}

// POST /api/anggota — hanya Admin
// Body: { nama, email, password, alamat?, noTelp?, status?, role? }
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 });
  }

  const { nama, email, password, alamat, noTelp, status, role } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof nama !== "string" || nama.trim() === "") {
    return NextResponse.json({ error: "Field 'nama' wajib diisi" }, { status: 400 });
  }
  if (typeof email !== "string" || email.trim() === "") {
    return NextResponse.json({ error: "Field 'email' wajib diisi" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Field 'password' wajib diisi dan minimal 8 karakter" },
      { status: 400 }
    );
  }

  const validRoles = ["ADMIN", "BENDAHARA", "ANGGOTA"] as const;
  const parsedRole = validRoles.includes(role as never)
    ? (role as (typeof validRoles)[number])
    : "ANGGOTA";

  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 12);

  try {
    const anggota = await prisma.anggota.create({
      data: {
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: parsedRole,
        alamat: typeof alamat === "string" ? alamat : undefined,
        noTelp: typeof noTelp === "string" ? noTelp : undefined,
        status: status === "NONAKTIF" ? "NONAKTIF" : "AKTIF",
      },
      select: {
        id: true, nama: true, email: true, role: true,
        status: true, tanggalGabung: true, createdAt: true,
      },
    });
    return NextResponse.json(anggota, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    throw e;
  }
}
