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
