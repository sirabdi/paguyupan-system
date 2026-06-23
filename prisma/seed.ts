import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
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

  console.log("Selesai.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
