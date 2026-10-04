import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { periodeSekarang, formatRupiah } from "@/utils";

// Cron job: buat tagihan iuran periode berjalan untuk semua anggota AKTIF.
// Menagih:
//   1. Iuran bulanan default tiap komunitas (JenisIuran.isDefault, interval 1 bulan).
//   2. Iuran tambahan aktif yang JATUH TEMPO pada periode ini
//      (setiap `intervalBulan` sejak bulan pembuatannya).
//
// Dipanggil scheduler eksternal (Vercel Cron / crontab / cron-job.org).
// Vercel Cron mengirim `Authorization: Bearer <CRON_SECRET>` jika env diset.

// Apakah `periode` (YYYY-MM) jatuh tempo untuk jenis iuran yang dibuat pada `createdAt`?
// Jatuh tempo jika selisih bulan sejak dibuat >= 0 dan kelipatan intervalBulan.
function jatuhTempo(periode: string, intervalBulan: number, createdAt: Date): boolean {
  const [y, m] = periode.split("-").map(Number);
  const createY = createdAt.getFullYear();
  const createM = createdAt.getMonth() + 1;
  const diff = (y - createY) * 12 + (m - createM);
  return diff >= 0 && diff % intervalBulan === 0;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periode = periodeSekarang();
  const periodeLabel = new Date(periode + "-01").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  // Semua jenis iuran aktif, dikelompokkan per komunitas
  const jenisList = await prisma.jenisIuran.findMany({
    where: { aktif: true },
    select: {
      id: true,
      komunitasId: true,
      nama: true,
      jumlah: true,
      intervalBulan: true,
      isDefault: true,
      createdAt: true,
    },
  });

  // Anggota aktif per komunitas (cache agar tidak query berulang)
  const anggotaByKomunitas = new Map<number, { id: number }[]>();
  async function getAnggota(komunitasId: number) {
    let list = anggotaByKomunitas.get(komunitasId);
    if (!list) {
      list = await prisma.anggota.findMany({
        where: { status: "AKTIF", komunitasId },
        select: { id: true },
      });
      anggotaByKomunitas.set(komunitasId, list);
    }
    return list;
  }

  let totalTagihanBaru = 0;

  for (const jenis of jenisList) {
    // Jenis default = tiap bulan; tambahan = sesuai interval & jatuh tempo
    const due = jenis.isDefault
      ? true
      : jatuhTempo(periode, jenis.intervalBulan, jenis.createdAt);
    if (!due) continue;

    const anggota = await getAnggota(jenis.komunitasId);
    if (anggota.length === 0) continue;

    const jumlah = new Prisma.Decimal(jenis.jumlah);

    // skipDuplicates + @@unique([anggotaId, periode, jenisIuranId]) => aman diulang
    const result = await prisma.iuran.createMany({
      data: anggota.map((a) => ({
        anggotaId: a.id,
        komunitasId: jenis.komunitasId,
        jenisIuranId: jenis.id,
        periode,
        jumlah,
      })),
      skipDuplicates: true,
    });
    totalTagihanBaru += result.count;

    // Notifikasi untuk tagihan yang baru dibuat
    const iuranBaru = await prisma.iuran.findMany({
      where: {
        anggotaId: { in: anggota.map((a) => a.id) },
        periode,
        jenisIuranId: jenis.id,
      },
      select: { id: true, anggotaId: true },
    });
    const jumlahRupiah = formatRupiah(Number(jumlah));

    await prisma.notifikasi.createMany({
      data: iuranBaru.map((i) => ({
        anggotaId: i.anggotaId,
        komunitasId: jenis.komunitasId,
        tipe: "IURAN_TAGIHAN" as const,
        judul: `Tagihan ${jenis.nama} ${periodeLabel}`,
        pesan: `Tagihan ${jenis.nama} periode ${periodeLabel} sebesar ${jumlahRupiah} telah diterbitkan. Segera lakukan pembayaran.`,
        referensiId: i.id,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    ok: true,
    periode,
    jenisDiproses: jenisList.length,
    tagihanBaru: totalTagihanBaru,
  });
}
