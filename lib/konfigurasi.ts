import "server-only";
import { prisma } from "@/lib/prisma";

// Konfigurasi aplikasi (key-value) yang tersimpan di DB.
export const IURAN_DEFAULT_KEY = "iuran_bulanan_default";

/**
 * Nominal iuran bulanan default.
 * Urutan: nilai di DB → env `IURAN_BULANAN_DEFAULT` (fallback) → "50000".
 */
export async function getIuranDefault(): Promise<string> {
  const row = await prisma.konfigurasi.findUnique({
    where: { key: IURAN_DEFAULT_KEY },
  });
  return row?.value ?? process.env.IURAN_BULANAN_DEFAULT ?? "50000";
}

/** Simpan/perbarui nominal iuran bulanan default. */
export async function setIuranDefault(value: string): Promise<string> {
  const row = await prisma.konfigurasi.upsert({
    where: { key: IURAN_DEFAULT_KEY },
    update: { value },
    create: { key: IURAN_DEFAULT_KEY, value },
  });
  return row.value;
}
