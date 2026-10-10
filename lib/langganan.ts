import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getInvoice, type XenditInvoiceStatus } from "@/lib/xendit";
import {
  PAKET,
  hitungPeriode,
  type DurasiBulan,
  type Paket,
  type PembayaranAcuan,
} from "@/modules/langganan.module/paket";

type Tx = Prisma.TransactionClient;

/** Pembayaran PAID terakhir — acuan tarif harian paket lama saat ganti paket. */
async function getAcuan(db: Tx, komunitasId: number, kecualiId?: number): Promise<PembayaranAcuan | null> {
  const last = await db.pembayaran.findFirst({
    where: { komunitasId, status: "PAID", ...(kecualiId ? { id: { not: kecualiId } } : {}) },
    orderBy: { paidAt: "desc" },
    select: { harga: true, durasiBulan: true, periodeMulai: true },
  });
  if (!last?.periodeMulai) return null;
  return { harga: Number(last.harga), durasiBulan: last.durasiBulan, periodeMulai: last.periodeMulai };
}

/** Pesan error jika jumlah akun melebihi kuota paket tujuan, atau null jika boleh. */
export async function cekKuotaPaket(komunitasId: number, paket: Paket): Promise<string | null> {
  const jumlahAkun = await prisma.anggota.count({ where: { komunitasId } });
  const kuota = PAKET[paket].kuotaAnggota;
  if (jumlahAkun <= kuota) return null;
  return `Jumlah akun komunitas (${jumlahAkun}) melebihi kuota paket ${PAKET[paket].label} (${kuota}). Nonaktifkan/hapus ${jumlahAkun - kuota} akun terlebih dahulu.`;
}

/** Estimasi periode untuk ditampilkan sebelum bayar (bonus hari bisa berubah sedikit saat dibayar). */
export async function estimasiPeriode(
  komunitas: { id: number; paket: Paket | null; expiredAt: Date | null },
  paketBaru: Paket,
  durasiBulan: DurasiBulan,
) {
  const acuan = await getAcuan(prisma, komunitas.id);
  return hitungPeriode({
    now: new Date(),
    paketLama: komunitas.paket,
    expiredAt: komunitas.expiredAt,
    acuan,
    paketBaru,
    durasiBulan,
  });
}

/**
 * Terapkan pembayaran yang LUNAS ke komunitas. Idempoten: webhook yang datang
 * berulang hanya diproses sekali (klaim status PENDING/EXPIRED → PAID secara atomik).
 * Return false jika sudah pernah diproses.
 */
export async function terapkanPembayaran(
  pembayaranId: number,
  info: { paidAt: Date; metode: string | null },
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const p = await tx.pembayaran.findUnique({
      where: { id: pembayaranId },
      select: { id: true, komunitasId: true, paket: true, durasiBulan: true, status: true },
    });
    if (!p || p.status === "PAID") return false;

    // Kunci baris komunitas agar dua pembayaran bersamaan tidak saling menimpa periode
    await tx.$queryRaw`SELECT id FROM komunitas WHERE id = ${p.komunitasId} FOR UPDATE`;

    const klaim = await tx.pembayaran.updateMany({
      where: { id: p.id, status: { in: ["PENDING", "EXPIRED"] } },
      data: { status: "PAID" },
    });
    if (klaim.count === 0) return false;

    const komunitas = await tx.komunitas.findUniqueOrThrow({
      where: { id: p.komunitasId },
      select: { paket: true, expiredAt: true, status: true },
    });
    const acuan = await getAcuan(tx, p.komunitasId, p.id);

    const hasil = hitungPeriode({
      now: info.paidAt,
      paketLama: komunitas.status === "MENUNGGU_PEMBAYARAN" ? null : komunitas.paket,
      expiredAt: komunitas.expiredAt,
      acuan,
      paketBaru: p.paket,
      durasiBulan: p.durasiBulan as DurasiBulan,
    });

    await tx.pembayaran.update({
      where: { id: p.id },
      data: {
        paidAt: info.paidAt,
        metode: info.metode,
        periodeMulai: hasil.periodeMulai,
        periodeSelesai: hasil.periodeSelesai,
        bonusHari: hasil.bonusHari,
      },
    });

    const cfg = PAKET[p.paket];
    await tx.komunitas.update({
      where: { id: p.komunitasId },
      data: {
        paket: p.paket,
        kuotaAnggota: cfg.kuotaAnggota,
        maxIuranTambahan: cfg.maxIuranTambahan,
        expiredAt: hasil.periodeSelesai,
        // SUSPEND tetap SUSPEND — hanya superadmin yang boleh mencabut
        ...(komunitas.status !== "SUSPEND" ? { status: "AKTIF" as const } : {}),
        pengingatH7At: null,
        pengingatH1At: null,
      },
    });
    return true;
  });
}

/**
 * Proses status invoice Xendit (dari webhook maupun pengecekan langsung).
 * PAID/SETTLED → terapkan pembayaran (idempoten), EXPIRED → tandai EXPIRED.
 */
export async function prosesStatusInvoice(
  pembayaran: { id: number; harga: Prisma.Decimal },
  inv: XenditInvoiceStatus,
): Promise<"diproses" | "sudah_diproses" | "nominal_kurang" | "expired" | "pending"> {
  if (inv.status === "PAID" || inv.status === "SETTLED") {
    const dibayar = inv.paid_amount ?? inv.amount ?? 0;
    if (dibayar < Number(pembayaran.harga)) {
      console.error("[xendit] nominal kurang", inv.external_id, dibayar, pembayaran.harga.toString());
      return "nominal_kurang";
    }
    const metode = [inv.payment_method, inv.payment_channel].filter(Boolean).join(" / ") || null;
    const diproses = await terapkanPembayaran(pembayaran.id, {
      paidAt: inv.paid_at ? new Date(inv.paid_at) : new Date(),
      metode,
    });
    return diproses ? "diproses" : "sudah_diproses";
  }

  if (inv.status === "EXPIRED") {
    await prisma.pembayaran.updateMany({
      where: { id: pembayaran.id, status: "PENDING" },
      data: { status: "EXPIRED" },
    });
    return "expired";
  }
  return "pending";
}

/**
 * Cocokkan invoice PENDING dengan status terbaru di Xendit. Cadangan bila webhook
 * tidak sampai (mis. development di localhost, atau webhook gagal terkirim).
 */
export async function sinkronkanPembayaranPending(komunitasId: number): Promise<void> {
  const pending = await prisma.pembayaran.findMany({
    where: { komunitasId, status: "PENDING", xenditInvoiceId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, harga: true, xenditInvoiceId: true },
  });
  await Promise.all(
    pending.map(async (p) => {
      try {
        const inv = await getInvoice(p.xenditInvoiceId!);
        if (inv.id && inv.id !== p.xenditInvoiceId) return;
        await prosesStatusInvoice(p, inv);
      } catch (e) {
        console.error("[langganan] sinkron invoice gagal:", p.xenditInvoiceId, e);
      }
    }),
  );
}

// ── Ringkasan untuk halaman /langganan ────────────────────────────────────────

export interface RingkasanLangganan {
  komunitas: {
    nama: string;
    paket: Paket | null;
    status: "MENUNGGU_PEMBAYARAN" | "AKTIF" | "SUSPEND";
    expiredAt: string | null;
    /** Sisa hari hingga expiredAt (dibulatkan ke atas, min 0); null jika belum pernah aktif. */
    sisaHari: number | null;
    kuotaAnggota: number;
    jumlahAkun: number;
  };
  admin: { nama: string; noTelp: string | null; email: string }[];
  // Hanya untuk admin:
  estimasi?: Record<Paket, Record<DurasiBulan, { periodeSelesai: string; bonusHari: number }>>;
  riwayat?: {
    id: number;
    paket: Paket;
    durasiBulan: number;
    harga: string;
    status: "PENDING" | "PAID" | "EXPIRED";
    metode: string | null;
    invoiceUrl: string | null;
    bonusHari: number;
    periodeSelesai: string | null;
    kedaluwarsaAt: string;
    paidAt: string | null;
    createdAt: string;
  }[];
}

export async function getRingkasanLangganan(
  komunitasId: number,
  isAdmin: boolean,
): Promise<RingkasanLangganan | null> {
  const k = await prisma.komunitas.findUnique({
    where: { id: komunitasId },
    select: {
      id: true,
      nama: true,
      paket: true,
      status: true,
      expiredAt: true,
      kuotaAnggota: true,
      _count: { select: { anggota: true } },
      anggota: {
        where: { role: "ADMIN" },
        select: { nama: true, noTelp: true, email: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!k) return null;

  const ringkasan: RingkasanLangganan = {
    komunitas: {
      nama: k.nama,
      paket: k.paket,
      status: k.status,
      expiredAt: k.expiredAt?.toISOString() ?? null,
      sisaHari: k.expiredAt
        ? Math.max(0, Math.ceil((k.expiredAt.getTime() - Date.now()) / 86_400_000))
        : null,
      kuotaAnggota: k.kuotaAnggota,
      jumlahAkun: k._count.anggota,
    },
    admin: k.anggota,
  };
  if (!isAdmin) return ringkasan;

  const acuan = await getAcuan(prisma, k.id);
  const now = new Date();
  const paketLama = k.status === "MENUNGGU_PEMBAYARAN" ? null : k.paket;
  const estimasi = {} as NonNullable<RingkasanLangganan["estimasi"]>;
  for (const paket of Object.keys(PAKET) as Paket[]) {
    estimasi[paket] = {} as Record<DurasiBulan, { periodeSelesai: string; bonusHari: number }>;
    for (const durasi of Object.keys(PAKET[paket].harga).map(Number) as DurasiBulan[]) {
      const h = hitungPeriode({ now, paketLama, expiredAt: k.expiredAt, acuan, paketBaru: paket, durasiBulan: durasi });
      estimasi[paket][durasi] = { periodeSelesai: h.periodeSelesai.toISOString(), bonusHari: h.bonusHari };
    }
  }

  const riwayat = await prisma.pembayaran.findMany({
    where: { komunitasId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    ...ringkasan,
    estimasi,
    riwayat: riwayat.map((p) => ({
      id: p.id,
      paket: p.paket,
      durasiBulan: p.durasiBulan,
      harga: p.harga.toString(),
      // PENDING yang sudah lewat batas bayar ditampilkan sebagai EXPIRED
      status: p.status === "PENDING" && p.kedaluwarsaAt <= now ? "EXPIRED" : p.status,
      metode: p.metode,
      invoiceUrl: p.status === "PENDING" && p.kedaluwarsaAt > now ? p.invoiceUrl : null,
      bonusHari: p.bonusHari,
      periodeSelesai: p.periodeSelesai?.toISOString() ?? null,
      kedaluwarsaAt: p.kedaluwarsaAt.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
