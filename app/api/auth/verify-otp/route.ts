import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim();

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Kode OTP harus 6 digit angka" }, { status: 400 });
  }

  try {
    await verifyOtp(auth.session.anggotaId, "verify_email", code);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verifikasi gagal" },
      { status: 400 },
    );
  }

  await prisma.anggota.update({
    where: { id: auth.session.anggotaId },
    data: { emailVerifiedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
