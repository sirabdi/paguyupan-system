import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPengingatLanggananEmail } from "@/lib/mailer";

const DAY_MS = 24 * 60 * 60 * 1000;
const HAPUS_PENDAFTARAN_SETELAH_HARI = 7;

// Cron harian (lihat vercel.json):
//   1. Email pengingat ke Admin pada H-7 dan H-1 sebelum langganan berakhir.
//   2. Tandai invoice PENDING yang lewat batas bayar → EXPIRED.
//   3. Hapus pendaftaran yang tidak dibayar dalam 7 hari (agar email bisa dipakai daftar ulang).
// "Kedaluwarsa" sendiri tidak perlu ditandai — diturunkan dari expiredAt saat request.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;

  // ── 1. Pengingat ────────────────────────────────────────────────────────────
  const akanBerakhir = await prisma.komunitas.findMany({
    where: {
      status: "AKTIF",
      expiredAt: { gt: now, lte: new Date(now.getTime() + 7 * DAY_MS) },
      OR: [{ pengingatH7At: null }, { pengingatH1At: null }],
    },
    select: {
      id: true,
      nama: true,
      expiredAt: true,
      pengingatH7At: true,
      pengingatH1At: true,
      anggota: { where: { role: "ADMIN", status: "AKTIF" }, select: { nama: true, email: true } },
    },
  });

  let pengingatTerkirim = 0;
  for (const k of akanBerakhir) {
    const sisaMs = k.expiredAt!.getTime() - now.getTime();
    const sisaHari = Math.ceil(sisaMs / DAY_MS);
    const h1 = sisaMs <= DAY_MS;

    // Dalam ≤1 hari → kirim H-1 saja (sekaligus tandai H-7 agar tidak dobel)
    if (h1 ? k.pengingatH1At : k.pengingatH7At) continue;

    for (const admin of k.anggota) {
      try {
        await sendPengingatLanggananEmail(admin.email, {
          nama: admin.nama,
          komunitas: k.nama,
          sisaHari,
          expiredAt: k.expiredAt!,
          url: `${appUrl}/langganan`,
        });
        pengingatTerkirim++;
      } catch (e) {
        console.error("[cron langganan] gagal kirim pengingat", k.id, admin.email, e);
      }
    }

    await prisma.komunitas.update({
      where: { id: k.id },
      data: h1 ? { pengingatH1At: now, pengingatH7At: k.pengingatH7At ?? now } : { pengingatH7At: now },
    });
  }

  // ── 2. Invoice kedaluwarsa ──────────────────────────────────────────────────
  const invoiceExpired = await prisma.pembayaran.updateMany({
    where: { status: "PENDING", kedaluwarsaAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  // ── 3. Pendaftaran tidak dibayar ────────────────────────────────────────────
  const pendaftaranDihapus = await prisma.komunitas.deleteMany({
    where: {
      status: "MENUNGGU_PEMBAYARAN",
      createdAt: { lt: new Date(now.getTime() - HAPUS_PENDAFTARAN_SETELAH_HARI * DAY_MS) },
      pembayaran: { none: { status: { in: ["PAID", "PENDING"] } } },
    },
  });

  return NextResponse.json({
    ok: true,
    pengingatTerkirim,
    invoiceExpired: invoiceExpired.count,
    pendaftaranDihapus: pendaftaranDihapus.count,
  });
}
