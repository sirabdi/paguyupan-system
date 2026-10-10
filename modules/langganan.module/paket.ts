// Konfigurasi paket langganan & perhitungan periode.
// Murni (tanpa I/O) — dipakai di client (tampilan harga) dan server (checkout/webhook).

export type Paket = "BASIC" | "PRO" | "MAX";
export type DurasiBulan = 1 | 3 | 9 | 12 | 24;

export const DURASI_OPTIONS: { value: DurasiBulan; label: string }[] = [
  { value: 1, label: "1 Bulan" },
  { value: 3, label: "3 Bulan" },
  { value: 9, label: "9 Bulan" },
  { value: 12, label: "1 Tahun" },
  { value: 24, label: "2 Tahun" },
];

export interface PaketInfo {
  label: string;
  kuotaAnggota: number; // termasuk admin & pengurus
  maxIuranTambahan: number;
  harga: Record<DurasiBulan, number>;
}

export const PAKET: Record<Paket, PaketInfo> = {
  BASIC: {
    label: "Basic",
    kuotaAnggota: 20,
    maxIuranTambahan: 3,
    harga: { 1: 29_000, 3: 82_000, 9: 235_000, 12: 295_000, 24: 520_000 },
  },
  PRO: {
    label: "Pro",
    kuotaAnggota: 50,
    maxIuranTambahan: 6,
    harga: { 1: 59_000, 3: 168_000, 9: 478_000, 12: 599_000, 24: 1_059_000 },
  },
  MAX: {
    label: "Max",
    kuotaAnggota: 120,
    maxIuranTambahan: 10,
    harga: { 1: 99_000, 3: 282_000, 9: 799_000, 12: 999_000, 24: 1_779_000 },
  },
};

export const PAKET_LIST: Paket[] = ["BASIC", "PRO", "MAX"];

export function isPaket(v: unknown): v is Paket {
  return typeof v === "string" && (PAKET_LIST as string[]).includes(v);
}

export function isDurasi(v: unknown): v is DurasiBulan {
  return DURASI_OPTIONS.some((d) => d.value === v);
}

export function durasiLabel(n: number): string {
  return DURASI_OPTIONS.find((d) => d.value === n)?.label ?? `${n} Bulan`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Tambah N bulan kalender. Tanggal yang tidak ada di bulan tujuan di-clamp (31 Jan + 1 → 28/29 Feb). */
export function tambahBulan(date: Date, n: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function selisihHari(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / DAY_MS;
}

export interface PembayaranAcuan {
  harga: number;
  durasiBulan: number;
  periodeMulai: Date;
}

export interface HasilPeriode {
  periodeMulai: Date;
  periodeSelesai: Date;
  bonusHari: number;
}

/**
 * Hitung periode langganan baru.
 *
 * - Belum pernah aktif / sudah kedaluwarsa  → mulai sekarang.
 * - Perpanjang paket yang sama              → mulai dari expiredAt lama (sisa hari tidak hilang).
 * - Ganti paket saat masih aktif            → mulai sekarang, sisa NILAI rupiah paket lama
 *                                              dikonversi menjadi hari di paket baru.
 *
 * `acuan` = pembayaran PAID terakhir (untuk tarif harian paket lama). Jika tidak ada,
 * dipakai tarif 1 bulan dari daftar harga.
 */
export function hitungPeriode(params: {
  now: Date;
  paketLama: Paket | null;
  expiredAt: Date | null;
  acuan: PembayaranAcuan | null;
  paketBaru: Paket;
  durasiBulan: DurasiBulan;
}): HasilPeriode {
  const { now, paketLama, expiredAt, acuan, paketBaru, durasiBulan } = params;
  const masihAktif = paketLama !== null && expiredAt !== null && expiredAt > now;

  if (!masihAktif) {
    return { periodeMulai: now, periodeSelesai: tambahBulan(now, durasiBulan), bonusHari: 0 };
  }

  if (paketLama === paketBaru) {
    return {
      periodeMulai: expiredAt,
      periodeSelesai: tambahBulan(expiredAt, durasiBulan),
      bonusHari: 0,
    };
  }

  // Ganti paket: konversi sisa nilai
  const sisaHari = selisihHari(now, expiredAt);
  const tarifLama = acuan
    ? acuan.harga /
      selisihHari(acuan.periodeMulai, tambahBulan(acuan.periodeMulai, acuan.durasiBulan))
    : PAKET[paketLama].harga[1] / 30;
  const sisaNilai = sisaHari * tarifLama;

  const selesaiDasar = tambahBulan(now, durasiBulan);
  const tarifBaru = PAKET[paketBaru].harga[durasiBulan] / selisihHari(now, selesaiDasar);
  const bonusHari = Math.max(0, Math.floor(sisaNilai / tarifBaru));

  return {
    periodeMulai: now,
    periodeSelesai: new Date(selesaiDasar.getTime() + bonusHari * DAY_MS),
    bonusHari,
  };
}

// ── Status akses ──────────────────────────────────────────────────────────────

export type AlasanBlokir = "MENUNGGU_PEMBAYARAN" | "KEDALUWARSA" | "SUSPEND";

export type StatusTampil = "AKTIF" | AlasanBlokir;

export const STATUS_TAMPIL_LABEL: Record<StatusTampil, string> = {
  AKTIF: "Aktif",
  MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
  KEDALUWARSA: "Kedaluwarsa",
  SUSPEND: "Suspend",
};

/** Status efektif komunitas: kedaluwarsa diturunkan dari expiredAt. */
export function statusTampil(
  k: { status: "MENUNGGU_PEMBAYARAN" | "AKTIF" | "SUSPEND"; expiredAt: Date | string | null },
  now: Date = new Date(),
): StatusTampil {
  if (k.status === "SUSPEND") return "SUSPEND";
  if (k.status === "MENUNGGU_PEMBAYARAN") return "MENUNGGU_PEMBAYARAN";
  if (!k.expiredAt || new Date(k.expiredAt) <= now) return "KEDALUWARSA";
  return "AKTIF";
}
