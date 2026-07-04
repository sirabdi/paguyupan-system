import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const anggota = [
    {
      nama: "Abdi Sembada Amirullah",
      email: "abdi@paguyupan.id",
      password: "admin",
      role: "ADMIN" as const,
      noTelp: "081234567890",
      alamat: "Jl. Merdeka No. 1, Jakarta",
    },
    {
      nama: "Rina Wulandari",
      email: "rina@paguyupan.id",
      password: "rina1234",
      role: "SEKERTARIS" as const,
      noTelp: "081987654321",
      alamat: "Jl. Cempaka No. 9, Malang",
    },
    {
      nama: "Siti Rahayu",
      email: "siti@paguyupan.id",
      password: "siti1234",
      role: "BENDAHARA" as const,
      noTelp: "082345678901",
      alamat: "Jl. Kenanga No. 5, Bandung",
    },
    {
      nama: "Budi Santoso",
      email: "budi@paguyupan.id",
      password: "budi1234",
      role: "ANGGOTA" as const,
      noTelp: "083456789012",
      alamat: "Jl. Melati No. 3, Surabaya",
    },
    {
      nama: "Dewi Kartika",
      email: "dewi@paguyupan.id",
      password: "dewi1234",
      role: "ANGGOTA" as const,
      noTelp: "084567890123",
      alamat: "Jl. Mawar No. 7, Yogyakarta",
    },
    {
      nama: "Rizky Pratama",
      email: "rizky@paguyupan.id",
      password: "rizky1234",
      role: "ANGGOTA" as const,
      noTelp: "085678901234",
      alamat: "Jl. Anggrek No. 12, Semarang",
    },
  ];

  console.log("Seeding anggota...");

  for (const a of anggota) {
    const passwordHash = await hash(a.password, 12);
    const result = await prisma.anggota.upsert({
      where: { email: a.email },
      update: { passwordHash, role: a.role, noTelp: a.noTelp, alamat: a.alamat },
      create: {
        nama: a.nama,
        email: a.email,
        passwordHash,
        role: a.role,
        noTelp: a.noTelp,
        alamat: a.alamat,
      },
    });
    console.log(`  ✓ ${result.nama} (${result.role})`);
  }

  // ── News ────────────────────────────────────────────────────────────────────

  const abdi = await prisma.anggota.findUniqueOrThrow({ where: { email: "abdi@paguyupan.id" } });
  const rina = await prisma.anggota.findUniqueOrThrow({ where: { email: "rina@paguyupan.id" } });
  const siti = await prisma.anggota.findUniqueOrThrow({ where: { email: "siti@paguyupan.id" } });

  const newsData = [
    {
      judul: "Selamat Datang di Sistem Paguyupan Digital",
      konten: `<p>Dengan bangga kami memperkenalkan sistem informasi paguyupan yang baru. Sistem ini dirancang untuk memudahkan pengelolaan anggota, pembayaran iuran, dan penyebaran informasi kepada seluruh anggota paguyupan.</p>
<p>Melalui platform ini, anggota dapat:</p>
<ul>
<li>Memantau status iuran bulanan secara real-time</li>
<li>Membaca berita dan pengumuman terkini</li>
<li>Berinteraksi melalui fitur komentar</li>
</ul>
<p>Kami berharap sistem ini dapat meningkatkan komunikasi dan transparansi di lingkungan paguyupan kita.</p>`,
      penulisId: abdi.id,
    },
    {
      judul: "Jadwal Arisan Bulan Juli 2026",
      konten: `<p>Kepada seluruh anggota paguyupan, berikut informasi pelaksanaan arisan bulan Juli 2026.</p>
<h2>Detail Acara</h2>
<ul>
<li><strong>Hari:</strong> Sabtu, 19 Juli 2026</li>
<li><strong>Waktu:</strong> 09.00 – 12.00 WIB</li>
<li><strong>Tempat:</strong> Balai Pertemuan RT 05, Jl. Merdeka No. 10</li>
</ul>
<p>Mohon kehadiran tepat waktu. Bagi yang berhalangan hadir wajib menitipkan iuran kepada koordinator RT masing-masing paling lambat H-1.</p>
<p>Terima kasih atas partisipasinya.</p>`,
      penulisId: rina.id,
    },
    {
      judul: "Laporan Keuangan Semester I 2026",
      konten: `<p>Berikut ringkasan laporan keuangan paguyupan periode Januari – Juni 2026.</p>
<h2>Rekapitulasi</h2>
<ul>
<li><strong>Total pemasukan iuran:</strong> Rp 18.000.000</li>
<li><strong>Pengeluaran kegiatan sosial:</strong> Rp 5.500.000</li>
<li><strong>Pengeluaran operasional:</strong> Rp 1.200.000</li>
<li><strong>Saldo akhir:</strong> Rp 11.300.000</li>
</ul>
<p>Laporan lengkap dapat diakses melalui bendahara atau diminta langsung pada pertemuan arisan berikutnya. Kami berkomitmen untuk menjaga transparansi pengelolaan keuangan demi kepercayaan seluruh anggota.</p>`,
      penulisId: siti.id,
    },
    {
      judul: "Kegiatan Bakti Sosial: Bersih-Bersih Lingkungan",
      konten: `<p>Paguyupan kita akan mengadakan kegiatan bakti sosial berupa kerja bakti membersihkan lingkungan sekitar.</p>
<h2>Informasi Kegiatan</h2>
<ul>
<li><strong>Tanggal:</strong> Minggu, 27 Juli 2026</li>
<li><strong>Waktu:</strong> 06.30 – 09.00 WIB</li>
<li><strong>Titik kumpul:</strong> Pos Ronda RT 05</li>
</ul>
<p>Peserta diharapkan membawa peralatan kebersihan masing-masing (sapu, cangkul, karung sampah). Konsumsi disediakan oleh panitia.</p>
<p>Mari bersama-sama menjaga kebersihan dan keindahan lingkungan kita!</p>`,
      penulisId: abdi.id,
    },
    {
      judul: "Pengumuman: Perubahan Jadwal Pengumpulan Iuran",
      konten: `<p>Diberitahukan kepada seluruh anggota bahwa mulai bulan Agustus 2026, jadwal pengumpulan iuran bulanan mengalami perubahan.</p>
<h2>Jadwal Baru</h2>
<p>Iuran dikumpulkan setiap tanggal <strong>1 – 10</strong> setiap bulan (sebelumnya tanggal 1 – 15).</p>
<p>Perubahan ini bertujuan agar pengelolaan keuangan lebih tertib dan laporan bulanan dapat diselesaikan tepat waktu.</p>
<p>Bagi anggota yang terlambat melebihi tanggal 10, dikenakan catatan administrasi. Harap dimaklumi dan kerjasamanya.</p>`,
      penulisId: rina.id,
    },
    {
      judul: "Sambutan Ketua: Refleksi Setengah Tahun Berjalan",
      konten: `<p>Assalamualaikum wr. wb. / Salam sejahtera untuk kita semua.</p>
<p>Tidak terasa kita telah melewati separuh tahun 2026 bersama. Alhamdulillah, paguyupan kita terus tumbuh dengan anggota yang aktif dan semangat kebersamaan yang tinggi.</p>
<p>Beberapa pencapaian semester ini:</p>
<ul>
<li>Tingkat partisipasi arisan mencapai 94%</li>
<li>Kegiatan bakti sosial berhasil diselenggarakan 2 kali</li>
<li>Digitalisasi sistem administrasi berhasil diluncurkan</li>
</ul>
<p>Ke depan, kita akan terus berinovasi untuk meningkatkan kualitas layanan dan kebersamaan. Terima kasih atas kepercayaan dan dukungan seluruh anggota.</p>
<p>Wassalamualaikum wr. wb.</p>`,
      penulisId: abdi.id,
    },
  ];

  console.log("Seeding news...");
  for (const n of newsData) {
    const news = await prisma.news.create({ data: n });
    console.log(`  ✓ "${news.judul}" by penulisId=${news.penulisId}`);
  }

  console.log("Selesai.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
