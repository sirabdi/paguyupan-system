import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import type { TipeKomunitas, StatusKomunitas } from "@/modules/komunitas.module";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_TIPE: TipeKomunitas[] = ["RT", "RW", "BLOK", "CUSTOM"];
const VALID_STATUS: StatusKomunitas[] = ["TRIAL", "AKTIF", "SUSPEND"];

const SELECT = {
  id: true,
  nama: true,
  tipe: true,
  kode: true,
  kuotaAnggota: true,
  durasiHari: true,
  status: true,
  expiredAt: true,
  alamatInduk: true,
  _count: { select: { anggota: true } },
  createdAt: true,
  updatedAt: true,
} as const;

// GET /api/komunitas/:id
export async function GET(_req: Request, { params }: RouteContext) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const komId = Number(id);
  if (!Number.isInteger(komId) || komId <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const komunitas = await prisma.komunitas.findUnique({ where: { id: komId }, select: SELECT });
  if (!komunitas) return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });

  return NextResponse.json(komunitas);
}

// PUT /api/komunitas/:id
export async function PUT(req: Request, { params }: RouteContext) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const komId = Number(id);
  if (!Number.isInteger(komId) || komId <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 }); }

  const { nama, tipe, kode, kuotaAnggota, status, durasiHari, alamatInduk } =
    (body ?? {}) as Record<string, unknown>;

  try {
    const komunitas = await prisma.komunitas.update({
      where: { id: komId },
      data: {
        ...(typeof nama === "string" && nama.trim() ? { nama: nama.trim() } : {}),
        ...(VALID_TIPE.includes(tipe as TipeKomunitas) ? { tipe: tipe as TipeKomunitas } : {}),
        ...(typeof kode === "string" && kode.trim() ? { kode: kode.trim().toUpperCase() } : {}),
        ...(typeof kuotaAnggota === "number" && kuotaAnggota > 0 ? { kuotaAnggota } : {}),
        ...(VALID_STATUS.includes(status as StatusKomunitas) ? { status: status as StatusKomunitas } : {}),
        ...(durasiHari === null ? { durasiHari: null } : typeof durasiHari === "number" && durasiHari > 0 ? { durasiHari } : {}),
        ...(typeof alamatInduk === "string" ? { alamatInduk: alamatInduk.trim() || null } : {}),
      },
      select: SELECT,
    });
    return NextResponse.json(komunitas);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });
      if (e.code === "P2002") return NextResponse.json({ error: "Kode komunitas sudah digunakan" }, { status: 409 });
    }
    throw e;
  }
}

// DELETE /api/komunitas/:id
export async function DELETE(_req: Request, { params }: RouteContext) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const komId = Number(id);
  if (!Number.isInteger(komId) || komId <= 0) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    await prisma.komunitas.delete({ where: { id: komId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });
    }
    throw e;
  }
}
