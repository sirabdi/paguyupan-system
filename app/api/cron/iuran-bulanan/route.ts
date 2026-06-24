import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Cron job: buat tagihan iuran periode berjalan untuk semua anggota AKTIF.
// Dipanggil oleh scheduler eksternal (Vercel Cron / crontab / cron-job.org).
//
// Vercel Cron otomatis mengirim header `Authorization: Bearer <CRON_SECRET>`
// jika env CRON_SECRET diset. Untuk crontab manual:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://domain/api/cron/iuran-bulanan

function periodeSekarang(): string {
  // YYYY-MM menurut zona waktu Asia/Jakarta (WIB)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

export async function GET(req: Request) {
  // --- Proteksi: wajib ada secret yang cocok ---
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periode = periodeSekarang();
  const jumlah = new Prisma.Decimal(process.env.IURAN_BULANAN_DEFAULT ?? "50000");

  const anggotaAktif = await prisma.anggota.findMany({
    where: { status: "AKTIF" },
    select: { id: true },
  });

  // skipDuplicates + @@unique([anggotaId, periode]) => aman dipanggil berulang
  const result = await prisma.iuran.createMany({
    data: anggotaAktif.map((a) => ({ anggotaId: a.id, periode, jumlah })),
    skipDuplicates: true,
  });

  // Buat notifikasi untuk setiap anggota yang punya tagihan periode ini
  // (query ulang untuk dapat id-nya, skipDuplicates agar aman dipanggil berulang)
  const periodeLabel = new Date(periode + "-01").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const jumlahRupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(jumlah));

  const iuranPeriodeIni = await prisma.iuran.findMany({
    where: { anggotaId: { in: anggotaAktif.map((a) => a.id) }, periode },
    select: { id: true, anggotaId: true },
  });

  await prisma.notifikasi.createMany({
    data: iuranPeriodeIni.map((i) => ({
      anggotaId: i.anggotaId,
      tipe: "IURAN_TAGIHAN" as const,
      judul: `Tagihan Iuran ${periodeLabel}`,
      pesan: `Tagihan iuran bulan ${periodeLabel} sebesar ${jumlahRupiah} telah diterbitkan. Segera lakukan pembayaran.`,
      referensiId: i.id,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({
    ok: true,
    periode,
    anggotaAktif: anggotaAktif.length,
    tagihanBaru: result.count,
  });
}
