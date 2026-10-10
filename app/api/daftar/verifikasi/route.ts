import { NextResponse } from "next/server";
import { verifyEmailOtp } from "@/lib/otp";
import { OTP_PURPOSE_REGISTRASI, setRegistrasiCookie } from "@/lib/registrasi";

// POST /api/daftar/verifikasi — cek OTP, lalu beri token pendaftaran (cookie, 30 menit)
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string; code?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const code = body?.code?.trim();

  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  }
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Kode OTP harus 6 digit angka" }, { status: 400 });
  }

  try {
    await verifyEmailOtp(email, OTP_PURPOSE_REGISTRASI, code);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verifikasi gagal" },
      { status: 400 },
    );
  }

  await setRegistrasiCookie(email);
  return NextResponse.json({ ok: true });
}
