import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as {
    code?: string;
    password?: string;
  } | null;

  const code = body?.code?.trim();
  const password = body?.password;

  if (!code || !password) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  try {
    await verifyOtp(auth.session.anggotaId, "change_password", code);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kode OTP tidak valid" },
      { status: 400 },
    );
  }

  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 12);

  await prisma.anggota.update({
    where: { id: auth.session.anggotaId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
