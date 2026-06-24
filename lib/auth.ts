import "server-only";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession, type SessionPayload } from "@/lib/session";

export type AuthResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

/** Pastikan request memiliki session yang valid. */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, session };
}

/** Pastikan request memiliki session dengan role tertentu. */
export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;

  if (!roles.includes(result.session.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      ),
    };
  }
  return result;
}

/** Shortcut: hanya Admin yang boleh. */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole("ADMIN");
}

/** Shortcut: Admin dan Sekertaris boleh (CRUD news). */
export async function requireNewsEditor(): Promise<AuthResult> {
  return requireRole("ADMIN", "SEKERTARIS");
}
