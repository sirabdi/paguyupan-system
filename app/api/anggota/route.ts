import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET /api/anggota?status=AKTIF&q=budi
// Daftar anggota, dengan filter opsional.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "AKTIF" | "NONAKTIF"
  const q = searchParams.get("q"); // cari berdasarkan nama

  const anggota = await prisma.anggota.findMany({
    where: {
      ...(status === "AKTIF" || status === "NONAKTIF" ? { status } : {}),
      ...(q ? { nama: { contains: q } } : {}),
    },
    orderBy: { nama: "asc" },
  });

  return NextResponse.json(anggota);
}

// POST /api/anggota
// Body: { nama, alamat?, noTelp?, email?, status? }
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 });
  }

  const { nama, alamat, noTelp, email, status } = (body ?? {}) as Record<string, unknown>;

  if (typeof nama !== "string" || nama.trim() === "") {
    return NextResponse.json({ error: "Field 'nama' wajib diisi" }, { status: 400 });
  }

  try {
    const anggota = await prisma.anggota.create({
      data: {
        nama: nama.trim(),
        alamat: typeof alamat === "string" ? alamat : undefined,
        noTelp: typeof noTelp === "string" ? noTelp : undefined,
        email: typeof email === "string" ? email : undefined,
        status: status === "NONAKTIF" ? "NONAKTIF" : "AKTIF",
      },
    });
    return NextResponse.json(anggota, { status: 201 });
  } catch (e) {
    // Email unik bentrok
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    throw e;
  }
}
