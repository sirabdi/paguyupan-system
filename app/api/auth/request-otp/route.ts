import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

const VALID_PURPOSES = ["verify_email", "change_password"] as const;
type Purpose = (typeof VALID_PURPOSES)[number];

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as { purpose?: string };
  const purpose: Purpose = VALID_PURPOSES.includes(body.purpose as Purpose)
    ? (body.purpose as Purpose)
    : "verify_email";

  const anggota = await prisma.anggota.findUnique({
    where: { id: auth.session.anggotaId },
    select: { email: true, emailVerifiedAt: true },
  });

  if (!anggota) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }

  if (purpose === "verify_email" && anggota.emailVerifiedAt) {
    return NextResponse.json({ error: "Email sudah terverifikasi" }, { status: 400 });
  }

  try {
    const code = await createOtp(auth.session.anggotaId, purpose);
    await sendOtpEmail(anggota.email, code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengirim OTP" },
      { status: 429 },
    );
  }
}
