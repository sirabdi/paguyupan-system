import { PrismaClient } from "@/generated/prisma/client";

// Singleton: hindari membuat koneksi baru tiap hot-reload saat development.
// Di production, satu instance per proses.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
