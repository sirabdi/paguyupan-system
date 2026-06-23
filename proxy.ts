import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const publicRoutes = ["/login"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const token = req.cookies.get("session")?.value;
  const session = token ? await decrypt(token) : null;

  // Belum login → paksa ke /login
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Sudah login tapi buka /login → arahkan sesuai role
  if (isPublicRoute && session) {
    let dest = "/guest";
    if (session.role === "ADMIN") dest = "/anggota";
    else if (session.role === "SEKERTARIS") dest = "/news";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|ico|svg)$).*)"],
};
