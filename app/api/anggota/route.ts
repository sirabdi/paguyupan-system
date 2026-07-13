import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, komunitasFilter } from "@/lib/auth";

// GET /api/anggota?status=AKTIF&q=budi&page=1
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const pageStr = searchParams.get("page");

  const where: Prisma.AnggotaWhereInput = {
    ...komunitasFilter(auth.session),
    ...(status === "AKTIF" || status === "NONAKTIF" ? { status } : {}),
    ...(q ? { nama: { contains: q } } : {}),
  };
  const select = {
    id: true,
    nama: true,
    alamat: true,
    noTelp: true,
    email: true,
    role: true,
    status: true,
    tanggalGabung: true,
    createdAt: true,
    updatedAt: true,
  };

  if (pageStr !== null) {
    const page = Math.max(1, Number(pageStr) || 1);
    const pageSize = 5;
    const [data, total] = await Promise.all([
      prisma.anggota.findMany({
        where,
        select,
        orderBy: { nama: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.anggota.count({ where }),
    ]);
    return NextResponse.json({
      data,
      page,
      page_size: pageSize,
      total,
      has_more: page * pageSize < total,
    });
  }

  const anggota = await prisma.anggota.findMany({
    where,
    select,
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
    return NextResponse.json(
      { error: "Body harus JSON yang valid" },
      { status: 400 },
    );
  }

  const { nama, email, password, alamat, noTelp, status, role } = (body ??
    {}) as Record<string, unknown>;

  if (typeof nama !== "string" || nama.trim() === "") {
    return NextResponse.json(
      { error: "Field 'nama' wajib diisi" },
      { status: 400 },
    );
  }
  if (typeof email !== "string" || email.trim() === "") {
    return NextResponse.json(
      { error: "Field 'email' wajib diisi" },
      { status: 400 },
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Field 'password' wajib diisi dan minimal 8 karakter" },
      { status: 400 },
    );
  }

  const validRoles = ["ADMIN", "BENDAHARA", "ANGGOTA"] as const;
  const parsedRole = validRoles.includes(role as never)
    ? (role as (typeof validRoles)[number])
    : "ANGGOTA";

  // Cek apakah email sudah terdaftar di komunitas lain
  const komunitasId = auth.session.komunitasId ?? undefined;
  const existingAnggota = await prisma.anggota.findUnique({
    where: { email: (email as string).trim().toLowerCase() },
    select: { komunitasId: true, komunitas: { select: { nama: true } } },
  });
  if (existingAnggota) {
    if (existingAnggota.komunitasId !== null && existingAnggota.komunitasId !== komunitasId) {
      const namaKomunitas = existingAnggota.komunitas?.nama ?? "komunitas lain";
      return NextResponse.json(
        { error: `Akun ini sudah terdaftar di komunitas "${namaKomunitas}"` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  // Cek duplikat no. rumah dalam komunitas yang sama
  if (typeof alamat === "string" && alamat.trim() && komunitasId) {
    const dupAlamat = await prisma.anggota.findFirst({
      where: { komunitasId, alamat: alamat.trim() },
      select: { nama: true },
    });
    if (dupAlamat) {
      return NextResponse.json(
        { error: `No. rumah "${alamat.trim()}" sudah ditempati oleh ${dupAlamat.nama}` },
        { status: 409 },
      );
    }
  }

  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 12);

  try {
    const anggota = await prisma.anggota.create({
      data: {
        nama: nama.trim(),
        email: (email as string).trim().toLowerCase(),
        passwordHash,
        role: parsedRole,
        alamat: typeof alamat === "string" ? alamat : undefined,
        noTelp: typeof noTelp === "string" ? noTelp : undefined,
        status: status === "NONAKTIF" ? "NONAKTIF" : "AKTIF",
        komunitasId,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        status: true,
        tanggalGabung: true,
        createdAt: true,
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
