import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    code?: string;
    password?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const code = body?.code?.trim();
  const password = body?.password;

  if (!email || !code || !password) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password minimal 8 karakter" },
      { status: 400 },
    );
  }

  const anggota = await prisma.anggota.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!anggota) {
    return NextResponse.json({ error: "Email tidak terdaftar" }, { status: 404 });
  }

  try {
    await verifyOtp(anggota.id, "reset_password", code);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kode OTP tidak valid" },
      { status: 400 },
    );
  }

  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 12);

  await prisma.anggota.update({
    where: { id: anggota.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
