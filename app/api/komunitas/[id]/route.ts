import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import type { TipeKomunitas, StatusKomunitas } from "@/modules/komunitas.module";
import { PAKET, isPaket } from "@/modules/langganan.module/paket";
import { SELECT } from "../route";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_TIPE: TipeKomunitas[] = ["RT", "RW", "BLOK", "CUSTOM"];
const VALID_STATUS: StatusKomunitas[] = ["MENUNGGU_PEMBAYARAN", "AKTIF", "SUSPEND"];

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

  const { nama, tipe, status, alamatInduk, paket, expiredAt } =
    (body ?? {}) as Record<string, unknown>;

  // expiredAt: ISO string, null (hapus), atau tidak dikirim (tidak berubah)
  let expiredAtData: { expiredAt?: Date | null } = {};
  if (expiredAt === null) {
    expiredAtData = { expiredAt: null };
  } else if (typeof expiredAt === "string") {
    const d = new Date(expiredAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Tanggal berlaku tidak valid" }, { status: 400 });
    }
    expiredAtData = { expiredAt: d };
  }

  // Ganti paket manual (mis. kompensasi) → kuota ikut paket
  const paketData = isPaket(paket)
    ? { paket, kuotaAnggota: PAKET[paket].kuotaAnggota, maxIuranTambahan: PAKET[paket].maxIuranTambahan }
    : paket === null
      ? { paket: null }
      : {};

  try {
    const komunitas = await prisma.komunitas.update({
      where: { id: komId },
      data: {
        ...(typeof nama === "string" && nama.trim() ? { nama: nama.trim() } : {}),
        ...(VALID_TIPE.includes(tipe as TipeKomunitas) ? { tipe: tipe as TipeKomunitas } : {}),
        ...(VALID_STATUS.includes(status as StatusKomunitas) ? { status: status as StatusKomunitas } : {}),
        ...(typeof alamatInduk === "string" ? { alamatInduk: alamatInduk.trim() || null } : {}),
        ...paketData,
        ...expiredAtData,
        // Masa berlaku diubah → pengingat dikirim ulang untuk periode baru
        ...(expiredAtData.expiredAt !== undefined ? { pengingatH7At: null, pengingatH1At: null } : {}),
      },
      select: SELECT,
    });
    return NextResponse.json(komunitas);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });
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
