import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const anggota = await prisma.anggota.findUnique({
    where: { id: auth.session.anggotaId },
    select: { email: true, emailVerifiedAt: true },
  });

  if (!anggota) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }

  if (anggota.emailVerifiedAt) {
    return NextResponse.json({ error: "Email sudah terverifikasi" }, { status: 400 });
  }

  try {
    const code = await createOtp(auth.session.anggotaId, "verify_email");
    await sendOtpEmail(anggota.email, code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengirim OTP" },
      { status: 429 },
    );
  }
}
