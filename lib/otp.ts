import "server-only";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export async function createOtp(anggotaId: number, purpose: string): Promise<string> {
  const recent = await prisma.otpCode.findFirst({
    where: { anggotaId, purpose, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const secondsAgo = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (secondsAgo < OTP_RATE_LIMIT_SECONDS) {
      const wait = Math.ceil(OTP_RATE_LIMIT_SECONDS - secondsAgo);
      throw new Error(`Tunggu ${wait} detik sebelum meminta OTP baru`);
    }
  }

  await prisma.otpCode.deleteMany({ where: { anggotaId, purpose } });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { anggotaId, purpose, codeHash: hashCode(code), expiresAt },
  });

  return code;
}

export async function verifyOtp(anggotaId: number, purpose: string, code: string): Promise<void> {
  const record = await prisma.otpCode.findFirst({
    where: { anggotaId, purpose, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new Error("OTP tidak ditemukan atau sudah digunakan");
  if (record.expiresAt < new Date()) throw new Error("OTP sudah kadaluarsa");
  if (record.codeHash !== hashCode(code)) throw new Error("Kode OTP tidak valid");

  await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
}

// ── OTP berbasis email (pendaftaran — akun belum ada) ─────────────────────────

const OTP_MAX_PERCOBAAN = 5;
const IP_WINDOW_MINUTES = 15;
const IP_MAX_REQUEST = 5;

export async function createEmailOtp(email: string, purpose: string, ip: string): Promise<string> {
  // Batas per IP: cegah endpoint publik dipakai untuk spam email
  const sejak = new Date(Date.now() - IP_WINDOW_MINUTES * 60 * 1000);
  const jumlahIp = await prisma.otpCode.count({
    where: { ip, purpose, createdAt: { gte: sejak } },
  });
  if (jumlahIp >= IP_MAX_REQUEST) {
    throw new Error(`Terlalu banyak permintaan. Coba lagi dalam ${IP_WINDOW_MINUTES} menit`);
  }

  const recent = await prisma.otpCode.findFirst({
    where: { email, purpose, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const secondsAgo = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (secondsAgo < OTP_RATE_LIMIT_SECONDS) {
      const wait = Math.ceil(OTP_RATE_LIMIT_SECONDS - secondsAgo);
      throw new Error(`Tunggu ${wait} detik sebelum meminta OTP baru`);
    }
  }

  // Tandai OTP lama tidak berlaku (tidak dihapus — dipakai untuk hitung batas per IP)
  await prisma.otpCode.updateMany({ where: { email, purpose, used: false }, data: { used: true } });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.otpCode.create({
    data: { email, ip, purpose, codeHash: hashCode(code), expiresAt },
  });
  return code;
}

export async function verifyEmailOtp(email: string, purpose: string, code: string): Promise<void> {
  const record = await prisma.otpCode.findFirst({
    where: { email, purpose, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new Error("OTP tidak ditemukan atau sudah digunakan");
  if (record.expiresAt < new Date()) throw new Error("OTP sudah kadaluarsa");

  if (record.codeHash !== hashCode(code)) {
    const percobaan = record.percobaan + 1;
    // Terlalu banyak salah → OTP hangus, cegah brute force 6 digit
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { percobaan, used: percobaan >= OTP_MAX_PERCOBAAN },
    });
    if (percobaan >= OTP_MAX_PERCOBAAN) {
      throw new Error("Terlalu banyak percobaan salah. Silakan minta kode OTP baru");
    }
    throw new Error("Kode OTP tidak valid");
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
}
