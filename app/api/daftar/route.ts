import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { getIuranDefault } from "@/lib/konfigurasi";
import { clearRegistrasiCookie, getRegistrasiEmail } from "@/lib/registrasi";
import { DaftarSchema } from "@/modules/daftar.module/dto";

// POST /api/daftar — buat komunitas + akun ADMIN (email sudah terverifikasi via OTP).
// Komunitas berstatus MENUNGGU_PEMBAYARAN sampai pembayaran pertama lunas.
export async function POST(req: Request) {
  const email = await getRegistrasiEmail();
  if (!email) {
    return NextResponse.json(
      { error: "Sesi verifikasi email habis. Silakan ulangi verifikasi email." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = DaftarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const passwordHash = await hash(d.password, 12);
  const defaultNominal = await getIuranDefault();

  let anggota: { id: number; komunitasId: number | null };
  try {
    anggota = await prisma.$transaction(async (tx) => {
      const komunitas = await tx.komunitas.create({
        data: {
          nama: d.namaKomunitas,
          tipe: d.tipe,
          alamatInduk: d.alamatKomunitas,
          status: "MENUNGGU_PEMBAYARAN",
        },
        select: { id: true },
      });

      // Setiap komunitas otomatis punya 1 jenis iuran default: "Iuran Bulanan"
      await tx.jenisIuran.create({
        data: {
          komunitasId: komunitas.id,
          nama: "Iuran Bulanan",
          jumlah: new Prisma.Decimal(defaultNominal),
          intervalBulan: 1,
          isDefault: true,
        },
      });

      return tx.anggota.create({
        data: {
          nama: d.nama,
          email,
          noTelp: d.noTelp,
          passwordHash,
          role: "ADMIN",
          emailVerifiedAt: new Date(),
          komunitasId: komunitas.id,
        },
        select: { id: true, komunitasId: true },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 },
      );
    }
    throw e;
  }

  await clearRegistrasiCookie();
  await createSession({ anggotaId: anggota.id, role: "ADMIN", komunitasId: anggota.komunitasId });

  return NextResponse.json({ ok: true }, { status: 201 });
}
