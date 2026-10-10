import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Token pendaftaran: bukti bahwa email sudah lolos OTP.
// Disimpan di cookie httpOnly terpisah dari cookie session, hanya dikirim ke /api/daftar.
const COOKIE = "registrasi";
const AUDIENCE = "registrasi";
const DURATION_SECONDS = 30 * 60;
export const OTP_PURPOSE_REGISTRASI = "registrasi";

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET tidak diset di environment");
  return new TextEncoder().encode(secret);
}

export async function setRegistrasiCookie(email: string): Promise<void> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${DURATION_SECONDS}s`)
    .sign(getKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DURATION_SECONDS,
    path: "/api/daftar",
  });
}

/** Email yang sudah terverifikasi, atau null jika token tidak ada/kedaluwarsa. */
export async function getRegistrasiEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
      audience: AUDIENCE,
    });
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function clearRegistrasiCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, "", { path: "/api/daftar", maxAge: 0 });
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
