import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import type { TipeKomunitas, StatusKomunitas } from "@/modules/komunitas.module";

const VALID_TIPE: TipeKomunitas[] = ["RT", "RW", "BLOK", "CUSTOM"];
const VALID_STATUS: StatusKomunitas[] = ["TRIAL", "AKTIF", "SUSPEND"];

export const SELECT = {
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

// GET /api/komunitas — daftar semua komunitas
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const data = await prisma.komunitas.findMany({
    select: SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(data);
}

// POST /api/komunitas — buat komunitas baru (durasi disimpan, expiredAt dihitung saat admin ditambahkan)
export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body harus JSON yang valid" }, { status: 400 }); }

  const { nama, tipe, kode, kuotaAnggota, status, durasiHari, alamatInduk } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof nama !== "string" || nama.trim() === "") {
    return NextResponse.json({ error: "Field 'nama' wajib diisi" }, { status: 400 });
  }
  if (!VALID_TIPE.includes(tipe as TipeKomunitas)) {
    return NextResponse.json({ error: "Field 'tipe' tidak valid" }, { status: 400 });
  }
  if (typeof alamatInduk !== "string" || alamatInduk.trim() === "") {
    return NextResponse.json({ error: "Field 'alamatInduk' wajib diisi" }, { status: 400 });
  }
  const resolvedKuota = typeof kuotaAnggota === "number" && kuotaAnggota > 0 ? kuotaAnggota : 50;
  const resolvedStatus: StatusKomunitas = VALID_STATUS.includes(status as StatusKomunitas)
    ? (status as StatusKomunitas)
    : "TRIAL";
  const resolvedDurasi = typeof durasiHari === "number" && durasiHari > 0 ? durasiHari : null;

  try {
    const komunitas = await prisma.komunitas.create({
      data: {
        nama: nama.trim(),
        tipe: tipe as TipeKomunitas,
        kode: typeof kode === "string" && kode.trim() ? kode.trim().toUpperCase() : undefined,
        kuotaAnggota: resolvedKuota,
        status: resolvedStatus,
        durasiHari: resolvedDurasi,
        alamatInduk: typeof alamatInduk === "string" ? alamatInduk.trim() : null,
      },
      select: SELECT,
    });
    return NextResponse.json(komunitas, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Kode komunitas sudah digunakan" }, { status: 409 });
    }
    throw e;
  }
}
