import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEmailOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { getClientIp, OTP_PURPOSE_REGISTRASI } from "@/lib/registrasi";
import { DaftarEmailSchema } from "@/modules/daftar.module/dto";

// POST /api/daftar/otp — kirim OTP ke email calon admin (publik)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = DaftarEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.anggota.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan login." },
      { status: 409 },
    );
  }

  let code: string;
  try {
    code = await createEmailOtp(email, OTP_PURPOSE_REGISTRASI, getClientIp(req));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat OTP" },
      { status: 429 },
    );
  }

  try {
    await sendOtpEmail(email, code);
  } catch {
    return NextResponse.json({ error: "Gagal mengirim email OTP" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
