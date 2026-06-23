import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Di Next.js 15+/16, `params` adalah Promise dan harus di-await.
type RouteContext = { params: Promise<{ id: string }> };

// GET /api/anggota/:id  — detail anggota + riwayat iuran
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const anggotaId = Number(id);
  if (!Number.isInteger(anggotaId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const anggota = await prisma.anggota.findUnique({
    where: { id: anggotaId },
    include: { iuran: { orderBy: { periode: "desc" } } },
  });

  if (!anggota) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(anggota);
}

// PUT /api/anggota/:id — update sebagian field
export async function PUT(req: Request, { params }: RouteContext) {
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
  const { nama, alamat, noTelp, email, status } = (body ?? {}) as Record<string, unknown>;

  try {
    const anggota = await prisma.anggota.update({
      where: { id: anggotaId },
      data: {
        ...(typeof nama === "string" ? { nama: nama.trim() } : {}),
        ...(typeof alamat === "string" ? { alamat } : {}),
        ...(typeof noTelp === "string" ? { noTelp } : {}),
        ...(typeof email === "string" ? { email } : {}),
        ...(status === "AKTIF" || status === "NONAKTIF" ? { status } : {}),
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

// DELETE /api/anggota/:id
export async function DELETE(_req: Request, { params }: RouteContext) {
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
