import "server-only";
import { timingSafeEqual } from "crypto";

// Klien minimal Xendit Invoice API (v2) — https://developers.xendit.co/api-reference/#create-invoice
const XENDIT_API = "https://api.xendit.co";

export const INVOICE_DURATION_SECONDS = 24 * 60 * 60; // invoice berlaku 24 jam

export class XenditNotConfiguredError extends Error {
  constructor() {
    super("Pembayaran belum dikonfigurasi (XENDIT_SECRET_KEY belum diset)");
  }
}

export interface CreateInvoiceInput {
  externalId: string;
  amount: number;
  description: string;
  payerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  itemName: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  status: string;
  invoice_url: string;
  expiry_date: string;
  amount: number;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<XenditInvoice> {
  const secret = process.env.XENDIT_SECRET_KEY;
  if (!secret) throw new XenditNotConfiguredError();

  const res = await fetch(`${XENDIT_API}/v2/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      currency: "IDR",
      description: input.description,
      payer_email: input.payerEmail,
      invoice_duration: INVOICE_DURATION_SECONDS,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      customer: {
        given_names: input.customerName,
        email: input.payerEmail,
        ...(input.customerPhone ? { mobile_number: input.customerPhone } : {}),
      },
      items: [{ name: input.itemName, quantity: 1, price: input.amount }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Xendit create invoice gagal (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Verifikasi header `x-callback-token` dari webhook Xendit. */
export function verifyCallbackToken(token: string | null): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Ambil status invoice langsung dari Xendit — cadangan jika webhook tidak sampai. */
export async function getInvoice(invoiceId: string): Promise<XenditInvoiceStatus> {
  const secret = process.env.XENDIT_SECRET_KEY;
  if (!secret) throw new XenditNotConfiguredError();

  const res = await fetch(`${XENDIT_API}/v2/invoices/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Xendit get invoice gagal (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Field status invoice — sama untuk payload webhook maupun GET invoice. */
export interface XenditInvoiceStatus {
  id?: string;
  external_id?: string;
  status?: string; // PENDING | PAID | SETTLED | EXPIRED
  amount?: number;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
}
