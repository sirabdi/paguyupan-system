import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 jam

export type SessionPayload = {
  anggotaId: number;
  role: Role;
  sessionId: string;
};

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET tidak diset di environment");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getEncodedKey());
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: Omit<SessionPayload, "sessionId">): Promise<void> {
  // Tandai session lama sebagai kicked (bukan langsung hapus) agar tab lain bisa detect reason
  await prisma.userSession.updateMany({
    where: { anggotaId: payload.anggotaId, kicked: false },
    data: { kicked: true },
  });

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await prisma.userSession.create({
    data: { id: sessionId, anggotaId: payload.anggotaId, expiresAt },
  });

  const token = await encrypt({ ...payload, sessionId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export type SessionResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; reason: "no_token" | "invalid_token" | "kicked" | "expired" };

export async function getSessionWithReason(): Promise<SessionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return { ok: false, reason: "no_token" };

  const payload = await decrypt(token);
  if (!payload) return { ok: false, reason: "invalid_token" };

  const dbSession = await prisma.userSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (!dbSession) return { ok: false, reason: "kicked" };
  if (dbSession.kicked) {
    // Hapus setelah dibaca agar tidak menumpuk di DB
    await prisma.userSession.delete({ where: { id: payload.sessionId } });
    return { ok: false, reason: "kicked" };
  }
  if (dbSession.expiresAt < new Date()) return { ok: false, reason: "expired" };

  return { ok: true, session: payload };
}

export async function getSession(): Promise<SessionPayload | null> {
  const result = await getSessionWithReason();
  return result.ok ? result.session : null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const payload = await decrypt(token);
    if (payload?.sessionId) {
      await prisma.userSession.deleteMany({ where: { id: payload.sessionId } });
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}
