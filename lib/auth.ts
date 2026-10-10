import "server-only";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSessionWithReason, type SessionPayload } from "@/lib/session";

export type AuthResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

/**
 * Pastikan request memiliki session yang valid DAN langganan komunitasnya aktif.
 * Endpoint yang tetap harus bisa dipakai saat langganan habis (auth, langganan)
 * memanggil dengan `{ izinkanTanpaLangganan: true }`.
 */
export async function requireAuth(
  opts: { izinkanTanpaLangganan?: boolean } = {},
): Promise<AuthResult> {
  const result = await getSessionWithReason();
  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      ),
    };
  }
  if (!result.akses.aktif && !opts.izinkanTanpaLangganan) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Langganan komunitas tidak aktif", alasan: result.akses.alasan },
        { status: 402 }
      ),
    };
  }
  return { ok: true, session: result.session };
}

/** Pastikan request memiliki session dengan role tertentu.
 *  SUPERADMIN selalu lolos kecuali role list hanya berisi role non-SUPERADMIN. */
export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;

  const { role } = result.session;
  if (role === "SUPERADMIN" || roles.includes(role)) return result;

  return {
    ok: false,
    response: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }),
  };
}

/** Shortcut: hanya SUPERADMIN. */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;

  if (result.session.role !== "SUPERADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }),
    };
  }
  return result;
}

/** Shortcut: hanya Admin komunitas yang boleh. */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole("ADMIN");
}

/** Shortcut: Admin dan Sekertaris boleh (CRUD news). */
export async function requireNewsEditor(): Promise<AuthResult> {
  return requireRole("ADMIN", "SEKERTARIS");
}

/**
 * Kembalikan filter Prisma `where` untuk komunitasId.
 * SUPERADMIN tidak difilter (null = akses semua).
 */
export function komunitasFilter(session: SessionPayload): { komunitasId?: number } {
  if (session.role === "SUPERADMIN" || session.komunitasId === null) return {};
  return { komunitasId: session.komunitasId };
}
