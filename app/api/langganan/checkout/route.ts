import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { cekKuotaPaket } from "@/lib/langganan";
import { createInvoice, INVOICE_DURATION_SECONDS, XenditNotConfiguredError } from "@/lib/xendit";
import { PAKET, durasiLabel, isDurasi, isPaket } from "@/modules/langganan.module/paket";

function baseUrl(req: Request): string {
  return process.env.APP_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
}

// POST /api/langganan/checkout { paket, durasiBulan } — buat invoice Xendit (Admin saja)
export async function POST(req: Request) {
  const auth = await requireAuth({ izinkanTanpaLangganan: true });
  if (!auth.ok) return auth.response;

  const { role, komunitasId, anggotaId } = auth.session;
  if (role !== "ADMIN" || komunitasId === null) {
    return NextResponse.json({ error: "Hanya Admin komunitas yang dapat membayar langganan" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { paket?: unknown; durasiBulan?: unknown } | null;
  const paket = body?.paket;
  const durasiBulan = body?.durasiBulan;
  if (!isPaket(paket)) return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
  if (!isDurasi(durasiBulan)) return NextResponse.json({ error: "Durasi tidak valid" }, { status: 400 });

  const komunitas = await prisma.komunitas.findUnique({
    where: { id: komunitasId },
    select: { nama: true, status: true },
  });
  if (!komunitas) return NextResponse.json({ error: "Komunitas tidak ditemukan" }, { status: 404 });
  if (komunitas.status === "SUSPEND") {
    return NextResponse.json(
      { error: "Komunitas sedang ditangguhkan. Hubungi pengelola layanan." },
      { status: 403 },
    );
  }

  // Downgrade ditolak jika jumlah akun melebihi kuota paket tujuan
  const errKuota = await cekKuotaPaket(komunitasId, paket);
  if (errKuota) return NextResponse.json({ error: errKuota }, { status: 409 });

  // Pakai ulang invoice PENDING yang sama & masih berlaku ≥ 10 menit
  const now = new Date();
  const pending = await prisma.pembayaran.findFirst({
    where: {
      komunitasId,
      paket,
      durasiBulan,
      status: "PENDING",
      invoiceUrl: { not: null },
      kedaluwarsaAt: { gt: new Date(now.getTime() + 10 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, invoiceUrl: true },
  });
  if (pending) return NextResponse.json({ id: pending.id, invoiceUrl: pending.invoiceUrl });

  const admin = await prisma.anggota.findUniqueOrThrow({
    where: { id: anggotaId },
    select: { nama: true, email: true, noTelp: true },
  });

  const harga = PAKET[paket].harga[durasiBulan];
  const externalId = `SUB-${komunitasId}-${createId()}`;
  const itemName = `Paguyupan ${PAKET[paket].label} — ${durasiLabel(durasiBulan)}`;

  const pembayaran = await prisma.pembayaran.create({
    data: {
      komunitasId,
      dibuatOlehId: anggotaId,
      externalId,
      paket,
      durasiBulan,
      harga: new Prisma.Decimal(harga),
      kedaluwarsaAt: new Date(now.getTime() + INVOICE_DURATION_SECONDS * 1000),
    },
    select: { id: true },
  });

  const url = baseUrl(req);
  try {
    const invoice = await createInvoice({
      externalId,
      amount: harga,
      description: `${itemName} untuk ${komunitas.nama}`,
      payerEmail: admin.email,
      customerName: admin.nama,
      customerPhone: admin.noTelp,
      itemName,
      successRedirectUrl: `${url}/langganan?bayar=sukses`,
      failureRedirectUrl: `${url}/langganan?bayar=gagal`,
    });

    await prisma.pembayaran.update({
      where: { id: pembayaran.id },
      data: {
        xenditInvoiceId: invoice.id,
        invoiceUrl: invoice.invoice_url,
        kedaluwarsaAt: new Date(invoice.expiry_date),
      },
    });
    return NextResponse.json({ id: pembayaran.id, invoiceUrl: invoice.invoice_url }, { status: 201 });
  } catch (e) {
    await prisma.pembayaran.update({ where: { id: pembayaran.id }, data: { status: "EXPIRED" } });
    if (e instanceof XenditNotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error("[checkout] Xendit error:", e);
    return NextResponse.json(
      { error: "Gagal membuat tagihan pembayaran. Coba lagi beberapa saat." },
      { status: 502 },
    );
  }
}
