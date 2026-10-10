import "dotenv/config";
import { PrismaClient, type Paket, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { PAKET, tambahBulan, type DurasiBulan } from "../modules/langganan.module/paket";

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

// Seeder data DEMO. Menghapus SEMUA data lalu membuat ulang — jangan jalankan di production.
//
// Skenario langganan yang disiapkan:
//   RT 01  — Basic, aktif ± 8 bulan lagi          (alur normal)
//   RW 05  — Pro, berakhir 5 hari lagi             (uji pengingat H-7 & perpanjang)
//   De Naila — Max, kedaluwarsa 3 hari lalu        (uji halaman blokir admin & anggota)
//   Griya Asri — baru daftar, belum bayar          (uji pembayaran pertama)

const now = new Date();

function periodeKe(offsetBulan: number): string {
  const d = tambahBulan(new Date(now.getFullYear(), now.getMonth(), 1), offsetBulan);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function tanggalDiPeriode(periode: string, hari: number): Date {
  const [y, m] = periode.split("-").map(Number);
  return new Date(y, m - 1, hari);
}

async function wipe() {
  // Komunitas cascade → anggota, news, iuran, jenis iuran, pembayaran, notifikasi, komentar, like
  await prisma.komunitas.deleteMany();
  await prisma.anggota.deleteMany(); // sisa: superadmin
  await prisma.otpCode.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.konfigurasi.deleteMany();
}

type AkunSeed = {
  nama: string;
  email: string;
  password: string;
  role: Role;
  noTelp: string;
  alamat?: string;
};

async function buatKomunitas(opts: {
  nama: string;
  tipe: "RT" | "RW" | "BLOK" | "CUSTOM";
  alamatInduk: string;
  paket: Paket | null;
  /** Pembayaran terakhir yang membentuk periode berjalan */
  langganan?: { durasiBulan: DurasiBulan; expiredAt: Date; metode: string };
  akun: AkunSeed[];
  iuranBulanan: number;
}) {
  const cfg = opts.paket ? PAKET[opts.paket] : null;
  const komunitas = await prisma.komunitas.create({
    data: {
      nama: opts.nama,
      tipe: opts.tipe,
      alamatInduk: opts.alamatInduk,
      paket: opts.paket,
      status: opts.langganan ? "AKTIF" : "MENUNGGU_PEMBAYARAN",
      expiredAt: opts.langganan?.expiredAt ?? null,
      kuotaAnggota: cfg?.kuotaAnggota ?? 20,
      maxIuranTambahan: cfg?.maxIuranTambahan ?? 3,
    },
  });

  const akun = [];
  for (const a of opts.akun) {
    akun.push(
      await prisma.anggota.create({
        data: {
          nama: a.nama,
          email: a.email,
          passwordHash: await hash(a.password, 12),
          role: a.role,
          noTelp: a.noTelp,
          alamat: a.alamat,
          komunitasId: komunitas.id,
          emailVerifiedAt: a.role === "ADMIN" ? now : null,
        },
      }),
    );
  }

  if (opts.langganan && opts.paket) {
    const { durasiBulan, expiredAt, metode } = opts.langganan;
    const periodeMulai = tambahBulan(expiredAt, -durasiBulan);
    const admin = akun.find((a) => a.role === "ADMIN");
    await prisma.pembayaran.create({
      data: {
        komunitasId: komunitas.id,
        dibuatOlehId: admin?.id,
        externalId: `SEED-${komunitas.id}-${periodeMulai.getTime()}`,
        paket: opts.paket,
        durasiBulan,
        harga: PAKET[opts.paket].harga[durasiBulan],
        status: "PAID",
        metode,
        periodeMulai,
        periodeSelesai: expiredAt,
        kedaluwarsaAt: new Date(periodeMulai.getTime() + DAY_MS),
        paidAt: periodeMulai,
        createdAt: periodeMulai,
      },
    });
  }

  const jenisBulanan = await prisma.jenisIuran.create({
    data: {
      komunitasId: komunitas.id,
      nama: "Iuran Bulanan",
      jumlah: opts.iuranBulanan,
      intervalBulan: 1,
      isDefault: true,
    },
  });

  return { komunitas, akun, jenisBulanan };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeder demo menghapus semua data — tidak boleh dijalankan di production.");
  }

  console.log("Menghapus data lama...");
  await wipe();

  // ── Superadmin ────────────────────────────────────────────────────────────────
  await prisma.anggota.create({
    data: {
      nama: "Super Admin",
      email: "superadmin@paguyupan.id",
      passwordHash: await hash("superadmin123", 12),
      role: "SUPERADMIN",
      emailVerifiedAt: now,
    },
  });
  console.log("  ✓ Superadmin");

  // ── RT 01 — Basic, aktif ──────────────────────────────────────────────────────
  const rt01 = await buatKomunitas({
    nama: "RT 01 RW 05 Kel. Cibadak",
    tipe: "RT",
    alamatInduk: "Kel. Cibadak, Kec. Tanah Sareal, Kota Bogor",
    paket: "BASIC",
    langganan: { durasiBulan: 12, expiredAt: tambahBulan(now, 8), metode: "QRIS / QRIS" },
    iuranBulanan: 30_000,
    akun: [
      { nama: "Abdi Sembada Amirullah", email: "abdi@paguyupan.id", password: "admin123", role: "ADMIN", noTelp: "081234567890" },
      { nama: "Rina Wulandari", email: "rina@paguyupan.id", password: "rina1234", role: "SEKERTARIS", noTelp: "081987654321", alamat: "Gang Melati No. 3" },
      { nama: "Siti Rahayu", email: "siti@paguyupan.id", password: "siti1234", role: "BENDAHARA", noTelp: "082345678901", alamat: "Gang Mawar No. 2" },
      { nama: "Budi Santoso", email: "budi@paguyupan.id", password: "budi1234", role: "ANGGOTA", noTelp: "083456789012", alamat: "Gang Mawar No. 4" },
      { nama: "Dewi Kartika", email: "dewi@paguyupan.id", password: "dewi1234", role: "ANGGOTA", noTelp: "084567890123", alamat: "Gang Anggrek No. 1" },
      { nama: "Rizky Pratama", email: "rizky@paguyupan.id", password: "rizky1234", role: "ANGGOTA", noTelp: "085678901234", alamat: "Gang Anggrek No. 5" },
    ],
  });
  console.log(`  ✓ ${rt01.komunitas.nama} (Basic, aktif)`);

  // ── RW 05 — Pro, berakhir 5 hari lagi ─────────────────────────────────────────
  const rw05 = await buatKomunitas({
    nama: "RW 05 Kel. Cibadak",
    tipe: "RW",
    alamatInduk: "Kel. Cibadak, Kec. Tanah Sareal, Kota Bogor",
    paket: "PRO",
    langganan: { durasiBulan: 3, expiredAt: new Date(now.getTime() + 5 * DAY_MS), metode: "BANK_TRANSFER / BCA" },
    iuranBulanan: 50_000,
    akun: [
      { nama: "Hendra Gunawan", email: "hendra@paguyupan.id", password: "hendra1234", role: "ADMIN", noTelp: "086789012345" },
      { nama: "Maya Sari", email: "maya@paguyupan.id", password: "maya1234", role: "ANGGOTA", noTelp: "087890123456", alamat: "Blok A No. 3" },
      { nama: "Eko Prasetyo", email: "eko@paguyupan.id", password: "eko12345", role: "ANGGOTA", noTelp: "088901234567", alamat: "Blok B No. 2" },
    ],
  });
  console.log(`  ✓ ${rw05.komunitas.nama} (Pro, berakhir 5 hari lagi)`);

  // ── De Naila — Max, kedaluwarsa ───────────────────────────────────────────────
  const denaila = await buatKomunitas({
    nama: "Perumahan De Naila Park",
    tipe: "BLOK",
    alamatInduk: "Perumahan De Naila Park PD 27, Kota Bogor",
    paket: "MAX",
    langganan: { durasiBulan: 1, expiredAt: new Date(now.getTime() - 3 * DAY_MS), metode: "EWALLET / OVO" },
    iuranBulanan: 75_000,
    akun: [
      { nama: "Fajar Nugroho", email: "fajar@paguyupan.id", password: "fajar1234", role: "ADMIN", noTelp: "089012345678" },
      { nama: "Lina Marlina", email: "lina@paguyupan.id", password: "lina1234", role: "ANGGOTA", noTelp: "081122334455", alamat: "PD 27 No. 8" },
    ],
  });
  console.log(`  ✓ ${denaila.komunitas.nama} (Max, kedaluwarsa)`);

  // ── Griya Asri — belum bayar ──────────────────────────────────────────────────
  const griya = await buatKomunitas({
    nama: "Griya Asri Blok C",
    tipe: "BLOK",
    alamatInduk: "Perumahan Griya Asri, Kota Depok",
    paket: null,
    iuranBulanan: 50_000,
    akun: [
      { nama: "Yoga Pratama", email: "yoga@paguyupan.id", password: "yoga1234", role: "ADMIN", noTelp: "082233445566" },
    ],
  });
  console.log(`  ✓ ${griya.komunitas.nama} (menunggu pembayaran)`);

  // ── Iuran 6 bulan terakhir (bulan berjalan belum bayar) ───────────────────────
  console.log("\nSeeding iuran...");
  const periode = Array.from({ length: 6 }, (_, i) => periodeKe(i - 5));

  const kebersihan = await prisma.jenisIuran.create({
    data: {
      komunitasId: rt01.komunitas.id,
      nama: "Iuran Kebersihan",
      jumlah: 15_000,
      intervalBulan: 3,
      isDefault: false,
      // Dibuat 5 bulan lalu → jatuh tempo di periode ke-0 dan ke-3
      createdAt: tanggalDiPeriode(periode[0], 1),
    },
  });

  for (const { komunitas, akun, jenisBulanan } of [rt01, rw05, denaila]) {
    for (const a of akun) {
      for (let i = 0; i < periode.length; i++) {
        const p = periode[i];
        const lunas = i < periode.length - 1 && !(a.id % 3 === 0 && i === periode.length - 2);
        await prisma.iuran.create({
          data: {
            anggotaId: a.id,
            komunitasId: komunitas.id,
            jenisIuranId: jenisBulanan.id,
            periode: p,
            jumlah: jenisBulanan.jumlah,
            status: lunas ? "LUNAS" : "BELUM_BAYAR",
            tanggalBayar: lunas ? tanggalDiPeriode(p, 3 + (a.id % 7)) : null,
          },
        });
      }
    }
  }

  for (const a of rt01.akun) {
    for (const [idx, p] of [periode[0], periode[3]].entries()) {
      const lunas = idx === 0;
      await prisma.iuran.create({
        data: {
          anggotaId: a.id,
          komunitasId: rt01.komunitas.id,
          jenisIuranId: kebersihan.id,
          periode: p,
          jumlah: 15_000,
          status: lunas ? "LUNAS" : "BELUM_BAYAR",
          tanggalBayar: lunas ? tanggalDiPeriode(p, 10) : null,
        },
      });
    }
  }
  console.log(`  ✓ Periode ${periode[0]} s/d ${periode[periode.length - 1]}`);

  // ── News ──────────────────────────────────────────────────────────────────────
  console.log("\nSeeding news...");
  const [abdi, rina, siti] = rt01.akun;
  const [hendra] = rw05.akun;
  const news = [
    {
      judul: "Selamat Datang di Sistem RT 01 RW 05",
      kategori: "BERITA" as const,
      konten: `<p>Dengan bangga kami memperkenalkan sistem informasi RT 01 RW 05 yang baru. Platform ini memudahkan pengelolaan anggota, pembayaran iuran, dan penyebaran informasi.</p>`,
      penulisId: abdi.id,
      komunitasId: rt01.komunitas.id,
    },
    {
      judul: "Jadwal Arisan Bulan Ini",
      kategori: "UNDANGAN" as const,
      konten: `<p>Arisan RT 01 akan dilaksanakan pada <strong>Sabtu minggu ketiga</strong> pukul 09.00 WIB di Balai RT. Harap hadir tepat waktu.</p>`,
      penulisId: rina.id,
      komunitasId: rt01.komunitas.id,
    },
    {
      judul: "Laporan Keuangan Semester Ini",
      kategori: "PENGUMUMAN" as const,
      konten: `<p>Saldo kas RT saat ini: <strong>Rp 4.500.000</strong>. Detail laporan dapat diminta ke bendahara.</p>`,
      penulisId: siti.id,
      komunitasId: rt01.komunitas.id,
    },
    {
      judul: "Kerja Bakti Lingkungan RW 05",
      kategori: "PENGUMUMAN" as const,
      konten: `<p>Kerja bakti membersihkan saluran air akan dilaksanakan Minggu pagi. Mohon partisipasi seluruh warga.</p>`,
      penulisId: hendra.id,
      komunitasId: rw05.komunitas.id,
    },
  ];
  for (const n of news) await prisma.news.create({ data: n });
  console.log(`  ✓ ${news.length} berita`);

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────────────────────────────");
  console.log("Akun untuk testing:");
  console.log("  SUPERADMIN            : superadmin@paguyupan.id / superadmin123");
  console.log("  RT 01 (Basic, aktif)  : abdi@paguyupan.id   / admin123   (Admin)");
  console.log("                          rina@paguyupan.id   / rina1234   (Sekertaris)");
  console.log("                          siti@paguyupan.id   / siti1234   (Bendahara)");
  console.log("                          budi@paguyupan.id   / budi1234   (Anggota)");
  console.log("  RW 05 (Pro, H-5)      : hendra@paguyupan.id / hendra1234 (Admin)");
  console.log("                          maya@paguyupan.id   / maya1234   (Anggota)");
  console.log("  De Naila (Max, habis) : fajar@paguyupan.id  / fajar1234  (Admin)");
  console.log("                          lina@paguyupan.id   / lina1234   (Anggota)");
  console.log("  Griya Asri (blm bayar): yoga@paguyupan.id   / yoga1234   (Admin)");
  console.log("─────────────────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
