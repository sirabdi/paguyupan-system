import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  }

  const anggota = await prisma.anggota.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // Selalu return ok agar tidak mengekspos apakah email terdaftar
  if (!anggota) return NextResponse.json({ ok: true });

  try {
    const code = await createOtp(anggota.id, "reset_password");
    await sendOtpEmail(anggota.email, code);
  } catch {
    // Abaikan error rate limit agar tidak mengekspos info
  }

  return NextResponse.json({ ok: true });
}
