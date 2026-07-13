import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Hitung expiredAt dari durasiHari (sama seperti logika di API admin)
function calcExpiredAt(durasiHari: number | null): Date | null {
  if (!durasiHari) return null;
  return new Date(Date.now() + durasiHari * 24 * 60 * 60 * 1000);
}

async function main() {
  // ── 1. SUPERADMIN ────────────────────────────────────────────────────────────
  console.log("Seeding superadmin...");
  const superadmin = await prisma.anggota.upsert({
    where: { email: "superadmin@paguyupan.id" },
    update: { passwordHash: await hash("superadmin123", 12), role: "SUPERADMIN" as const, komunitasId: null },
    create: {
      nama: "Super Admin",
      email: "superadmin@paguyupan.id",
      passwordHash: await hash("superadmin123", 12),
      role: "SUPERADMIN" as const,
      komunitasId: null,
    },
  });
  console.log(`  ✓ ${superadmin.nama} (${superadmin.role})`);

  // ── 2. Komunitas ─────────────────────────────────────────────────────────────
  // SUPERADMIN membuat komunitas — durasi disimpan, expiredAt BELUM dihitung.
  // expiredAt baru dihitung saat Admin pertama ditambahkan (lihat step 3).
  console.log("\nSeeding komunitas...");

  const komRT01 = await prisma.komunitas.upsert({
    where: { kode: "RT01-RW05-CIBADAK" },
    update: { durasiHari: 365 },
    create: {
      nama: "RT 01 RW 05 Kel. Cibadak",
      tipe: "RT",
      kode: "RT01-RW05-CIBADAK",
      kuotaAnggota: 30,
      durasiHari: 365,
      status: "TRIAL",
      alamatInduk: "Kel. Cibadak, Kec. Tanah Sareal, Kota Bogor",
    },
  });
  console.log(`  ✓ ${komRT01.nama} (${komRT01.tipe}) — durasi: ${komRT01.durasiHari} hari`);

  const komRW05 = await prisma.komunitas.upsert({
    where: { kode: "RW05-CIBADAK" },
    update: { durasiHari: 730 },
    create: {
      nama: "RW 05 Kel. Cibadak",
      tipe: "RW",
      kode: "RW05-CIBADAK",
      kuotaAnggota: 150,
      durasiHari: 730,
      status: "TRIAL",
      alamatInduk: "Kel. Cibadak, Kec. Tanah Sareal, Kota Bogor",
    },
  });
  console.log(`  ✓ ${komRW05.nama} (${komRW05.tipe}) — durasi: ${komRW05.durasiHari} hari`);

  const komBlok = await prisma.komunitas.upsert({
    where: { kode: "PD27-DENAILA" },
    update: {},
    create: {
      nama: "Perumahan De Naila Park",
      tipe: "BLOK",
      kode: "PD27-DENAILA",
      kuotaAnggota: 50,
      durasiHari: null,        // tidak ada batas waktu
      status: "TRIAL",
      alamatInduk: "Perumahan De Naila Park PD 27, Kota Bogor",
    },
  });
  console.log(`  ✓ ${komBlok.nama} (${komBlok.tipe}) — tanpa batas waktu`);

  // ── 3. Admin per komunitas ────────────────────────────────────────────────────
  // Saat Admin ditambahkan: status komunitas → AKTIF, expiredAt dihitung dari sekarang.
  // Ini mereplikasi logika POST /api/komunitas/:id/admin.
  console.log("\nSeeding admin komunitas...");

  async function seedAdmin(komId: number, durasiHari: number | null, data: {
    nama: string; email: string; password: string; noTelp: string;
  }) {
    const passwordHash = await hash(data.password, 12);
    const expiredAt = calcExpiredAt(durasiHari);

    const [anggota] = await prisma.$transaction([
      prisma.anggota.upsert({
        where: { email: data.email },
        update: { passwordHash, role: "ADMIN", noTelp: data.noTelp, komunitasId: komId },
        create: {
          nama: data.nama,
          email: data.email,
          passwordHash,
          role: "ADMIN",
          noTelp: data.noTelp,
          komunitasId: komId,
        },
      }),
      prisma.komunitas.update({
        where: { id: komId },
        data: { status: "AKTIF", expiredAt },
      }),
    ]);
    return anggota;
  }

  const adminRT01 = await seedAdmin(komRT01.id, komRT01.durasiHari, {
    nama: "Abdi Sembada Amirullah",
    email: "abdi@paguyupan.id",
    password: "admin123",
    noTelp: "081234567890",
  });
  console.log(`  ✓ ${adminRT01.nama} (ADMIN) → ${komRT01.nama}`);

  const adminRW05 = await seedAdmin(komRW05.id, komRW05.durasiHari, {
    nama: "Hendra Gunawan",
    email: "hendra@paguyupan.id",
    password: "hendra1234",
    noTelp: "086789012345",
  });
  console.log(`  ✓ ${adminRW05.nama} (ADMIN) → ${komRW05.nama}`);

  // Blok sengaja tidak diberi Admin — untuk demo section "Menunggu Admin" di superadmin panel

  // ── 4. Anggota per komunitas ──────────────────────────────────────────────────
  // alamat = hanya partial (Gang / No. rumah / No. blok).
  // alamatInduk komunitas menjadi prefix yang sudah ditetapkan superadmin.
  console.log("\nSeeding anggota RT 01...");

  const anggotaRT01 = [
    { nama: "Rina Wulandari",  email: "rina@paguyupan.id",  password: "rina1234",  role: "SEKERTARIS" as const, noTelp: "081987654321", alamat: "Gang Melati No. 3" },
    { nama: "Siti Rahayu",     email: "siti@paguyupan.id",  password: "siti1234",  role: "BENDAHARA" as const,  noTelp: "082345678901", alamat: "Gang Mawar No. 2" },
    { nama: "Budi Santoso",    email: "budi@paguyupan.id",  password: "budi1234",  role: "ANGGOTA" as const,    noTelp: "083456789012", alamat: "Gang Mawar No. 4" },
    { nama: "Dewi Kartika",    email: "dewi@paguyupan.id",  password: "dewi1234",  role: "ANGGOTA" as const,    noTelp: "084567890123", alamat: "Gang Anggrek No. 1" },
    { nama: "Rizky Pratama",   email: "rizky@paguyupan.id", password: "rizky1234", role: "ANGGOTA" as const,    noTelp: "085678901234", alamat: "Gang Anggrek No. 5" },
  ];

  for (const a of anggotaRT01) {
    const passwordHash = await hash(a.password, 12);
    const result = await prisma.anggota.upsert({
      where: { email: a.email },
      update: { passwordHash, role: a.role, noTelp: a.noTelp, alamat: a.alamat, komunitasId: komRT01.id },
      create: { nama: a.nama, email: a.email, passwordHash, role: a.role, noTelp: a.noTelp, alamat: a.alamat, komunitasId: komRT01.id },
    });
    console.log(`  ✓ ${result.nama} (${result.role}) — ${a.alamat}`);
  }

  console.log("\nSeeding anggota RW 05...");

  const anggotaRW05 = [
    { nama: "Maya Sari",    email: "maya@paguyupan.id", password: "maya1234", role: "ANGGOTA" as const, noTelp: "087890123456", alamat: "Blok A No. 3" },
    { nama: "Eko Prasetyo", email: "eko@paguyupan.id",  password: "eko12345", role: "ANGGOTA" as const, noTelp: "088901234567", alamat: "Blok B No. 2" },
  ];

  for (const a of anggotaRW05) {
    const passwordHash = await hash(a.password, 12);
    const result = await prisma.anggota.upsert({
      where: { email: a.email },
      update: { passwordHash, role: a.role, noTelp: a.noTelp, alamat: a.alamat, komunitasId: komRW05.id },
      create: { nama: a.nama, email: a.email, passwordHash, role: a.role, noTelp: a.noTelp, alamat: a.alamat, komunitasId: komRW05.id },
    });
    console.log(`  ✓ ${result.nama} (${result.role}) — ${a.alamat}`);
  }

  // ── 5. Iuran per komunitas ────────────────────────────────────────────────────
  console.log("\nSeeding iuran...");

  // 6 bulan terakhir: Feb–Jul 2026
  const PERIODE = ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
  const JUMLAH_RT01 = 30000;   // Rp 30.000 / bulan
  const JUMLAH_RW05 = 50000;   // Rp 50.000 / bulan

  function tanggalBayar(periode: string, hari: number): Date {
    const [y, m] = periode.split("-").map(Number);
    return new Date(y, m - 1, hari);
  }

  // Semua anggota RT 01 (termasuk admin & pengurus)
  const semuaRT01 = await prisma.anggota.findMany({
    where: { komunitasId: komRT01.id },
    select: { id: true, nama: true },
  });

  await prisma.iuran.deleteMany({ where: { komunitasId: komRT01.id } });

  for (const anggota of semuaRT01) {
    for (let i = 0; i < PERIODE.length; i++) {
      const periode = PERIODE[i];
      // 5 bulan pertama lunas, bulan terakhir (Juli) belum bayar
      const lunas = i < 5;
      await prisma.iuran.create({
        data: {
          anggotaId: anggota.id,
          komunitasId: komRT01.id,
          periode,
          jumlah: JUMLAH_RT01,
          status: lunas ? "LUNAS" : "BELUM_BAYAR",
          tanggalBayar: lunas ? tanggalBayar(periode, 5 + (anggota.id % 5)) : null,
        },
      });
    }
    console.log(`  ✓ Iuran ${PERIODE.length}x → ${anggota.nama}`);
  }

  // Semua anggota RW 05
  const semuaRW05 = await prisma.anggota.findMany({
    where: { komunitasId: komRW05.id },
    select: { id: true, nama: true },
  });

  await prisma.iuran.deleteMany({ where: { komunitasId: komRW05.id } });

  for (const anggota of semuaRW05) {
    for (let i = 0; i < PERIODE.length; i++) {
      const periode = PERIODE[i];
      // Variasi: anggota ganjil ada 1 bulan belum bayar (Mei), anggota genap semua lunas kecuali Juli
      const belumBayar = i === 5 || (anggota.id % 2 !== 0 && i === 3);
      await prisma.iuran.create({
        data: {
          anggotaId: anggota.id,
          komunitasId: komRW05.id,
          periode,
          jumlah: JUMLAH_RW05,
          status: belumBayar ? "BELUM_BAYAR" : "LUNAS",
          tanggalBayar: belumBayar ? null : tanggalBayar(periode, 3 + (anggota.id % 7)),
        },
      });
    }
    console.log(`  ✓ Iuran ${PERIODE.length}x → ${anggota.nama}`);
  }

  // ── 6. News per komunitas ─────────────────────────────────────────────────────
  console.log("\nSeeding news RT 01...");

  const abdi = await prisma.anggota.findUniqueOrThrow({ where: { email: "abdi@paguyupan.id" } });
  const rina  = await prisma.anggota.findUniqueOrThrow({ where: { email: "rina@paguyupan.id" } });
  const siti  = await prisma.anggota.findUniqueOrThrow({ where: { email: "siti@paguyupan.id" } });

  // Hapus news lama agar tidak duplikat saat re-seed
  await prisma.news.deleteMany({ where: { komunitasId: komRT01.id } });

  const newsRT01 = [
    {
      judul: "Selamat Datang di Sistem RT 01 RW 05",
      kategori: "BERITA" as const,
      konten: `<p>Dengan bangga kami memperkenalkan sistem informasi RT 01 RW 05 yang baru. Platform ini memudahkan pengelolaan anggota, pembayaran iuran, dan penyebaran informasi.</p>`,
      penulisId: abdi.id,
      komunitasId: komRT01.id,
    },
    {
      judul: "Jadwal Arisan Bulan Juli 2026",
      kategori: "UNDANGAN" as const,
      konten: `<p>Arisan RT 01 akan dilaksanakan pada <strong>Sabtu, 19 Juli 2026</strong> pukul 09.00 WIB di Balai RT. Harap hadir tepat waktu.</p>`,
      penulisId: rina.id,
      komunitasId: komRT01.id,
    },
    {
      judul: "Laporan Keuangan Semester I 2026",
      kategori: "PENGUMUMAN" as const,
      konten: `<p>Saldo kas RT per Juni 2026: <strong>Rp 4.500.000</strong>. Detail laporan dapat diminta ke bendahara.</p>`,
      penulisId: siti.id,
      komunitasId: komRT01.id,
    },
  ];

  for (const n of newsRT01) {
    const news = await prisma.news.create({ data: n });
    console.log(`  ✓ [${news.kategori}] "${news.judul}"`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────────────────");
  console.log("Akun untuk testing:");
  console.log("  SUPERADMIN   : superadmin@paguyupan.id  / superadmin123");
  console.log("  ADMIN RT 01  : abdi@paguyupan.id        / admin123");
  console.log("  SEKERTARIS   : rina@paguyupan.id        / rina1234");
  console.log("  BENDAHARA    : siti@paguyupan.id        / siti1234");
  console.log("  ANGGOTA      : budi@paguyupan.id        / budi1234");
  console.log("  ADMIN RW 05  : hendra@paguyupan.id      / hendra1234");
  console.log("");
  console.log("Komunitas:");
  console.log(`  RT 01 RW 05  — AKTIF, ada admin, expiredAt dihitung dari sekarang`);
  console.log(`  RW 05        — AKTIF, ada admin, expiredAt dihitung dari sekarang`);
  console.log(`  De Naila PD27 — TRIAL, BELUM ada admin (demo section 'Menunggu Admin')`);
  console.log("─────────────────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
