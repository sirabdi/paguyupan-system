import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const PUBLIC_ROUTES = ["/login"];

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

// Optimistic check: verifikasi JWT signature saja tanpa DB call.
// Single session enforcement dan sliding session ditangani di lib/session.ts (server-side).
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(path);

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const key = getEncodedKey();

  let isValidToken = false;
  let role: string | null = null;

  if (token && key) {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
      role = payload.role as string;
      isValidToken = true;
    } catch {
      isValidToken = false;
    }
  }

  // Belum login → paksa ke /login
  if (!isPublicRoute && !isValidToken) {
    const res = NextResponse.redirect(new URL("/login", req.nextUrl));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  // Sudah login tapi buka /login → arahkan sesuai role
  if (isPublicRoute && isValidToken) {
    let dest = "/guest";
    if (role === "ADMIN") dest = "/anggota";
    else if (role === "SEKERTARIS") dest = "/news";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|ico|svg)$).*)"],
};
