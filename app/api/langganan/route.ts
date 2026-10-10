import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getRingkasanLangganan, sinkronkanPembayaranPending } from "@/lib/langganan";

// GET /api/langganan — status langganan komunitas user (tetap bisa diakses saat langganan habis)
export async function GET() {
  const auth = await requireAuth({ izinkanTanpaLangganan: true });
  if (!auth.ok) return auth.response;

  const { komunitasId, role } = auth.session;
  if (komunitasId === null) {
    return NextResponse.json({ error: "Akun tidak terikat komunitas" }, { status: 400 });
  }

  // Cek invoice PENDING langsung ke Xendit agar status tetap terbarui walau webhook tidak sampai
  if (role === "ADMIN") await sinkronkanPembayaranPending(komunitasId);

  const data = await getRingkasanLangganan(komunitasId, role === "ADMIN");
  if (!data) return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });
  return NextResponse.json(data);
}
