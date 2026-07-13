import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const PUBLIC_ROUTES = ["/login"];
const PUBLIC_PREFIXES = ["/news/"];

const SUPERADMIN_PREFIX = "/superadmin";

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

// Optimistic check: verifikasi JWT signature saja tanpa DB call.
// Single session enforcement dan sliding session ditangani di lib/session.ts (server-side).
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute =
    PUBLIC_ROUTES.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));

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

  // Halaman /superadmin/* hanya untuk SUPERADMIN
  if (path.startsWith(SUPERADMIN_PREFIX) && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Sudah login tapi buka /login → arahkan sesuai role
  // (halaman publik seperti /news/[id] tetap bisa diakses meski sudah login)
  const isLoginPage = PUBLIC_ROUTES.includes(path);
  if (isLoginPage && isValidToken) {
    const dest = role === "SUPERADMIN" ? "/superadmin" : "/guest";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|ico|svg)$).*)"],
};
