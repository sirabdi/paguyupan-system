import { toError } from "@/lib/fetch-client";
import type { DaftarDTO } from "./dto";

export * from "./dto";

const JSON_HEADERS = { "Content-Type": "application/json" };

// Tidak pakai fetchClient — user belum login, 401/402 di sini bukan soal session

export async function requestDaftarOtp(email: string): Promise<void> {
  const res = await fetch("/api/daftar/otp", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await toError(res, "Gagal mengirim kode OTP");
}

export async function verifyDaftarOtp(email: string, code: string): Promise<void> {
  const res = await fetch("/api/daftar/verifikasi", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) throw await toError(res, "Verifikasi gagal");
}

export async function submitDaftar(input: DaftarDTO): Promise<void> {
  const res = await fetch("/api/daftar", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Pendaftaran gagal");
}
