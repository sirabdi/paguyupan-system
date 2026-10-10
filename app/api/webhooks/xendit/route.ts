import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prosesStatusInvoice } from "@/lib/langganan";
import { verifyCallbackToken, type XenditInvoiceStatus } from "@/lib/xendit";

// POST /api/webhooks/xendit — callback Invoice dari Xendit.
// Diset di Dashboard Xendit → Settings → Webhooks → "Invoices paid".
// Selalu balas 200 untuk event yang dikenali agar Xendit tidak retry tanpa henti.
export async function POST(req: Request) {
  if (!verifyCallbackToken(req.headers.get("x-callback-token"))) {
    return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as XenditInvoiceStatus | null;
  if (!body?.external_id || !body.status) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const pembayaran = await prisma.pembayaran.findUnique({
    where: { externalId: body.external_id },
    select: { id: true, harga: true, status: true, xenditInvoiceId: true },
  });
  // Bukan invoice langganan dari aplikasi ini (mis. test callback dari dashboard)
  if (!pembayaran) return NextResponse.json({ ok: true, ignored: true });

  if (body.id && pembayaran.xenditInvoiceId && body.id !== pembayaran.xenditInvoiceId) {
    return NextResponse.json({ error: "Invoice ID tidak cocok" }, { status: 400 });
  }

  const hasil = await prosesStatusInvoice(pembayaran, body);
  if (hasil === "nominal_kurang") {
    return NextResponse.json({ error: "Nominal pembayaran tidak sesuai" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, diproses: hasil === "diproses" });
}
