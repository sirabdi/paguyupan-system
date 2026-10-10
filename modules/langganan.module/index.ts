import { fetchClient, toError } from "@/lib/fetch-client";
import type { RingkasanLangganan } from "@/lib/langganan";
import type { DurasiBulan, Paket } from "./paket";

export * from "./paket";
export type { RingkasanLangganan };

export const LANGGANAN_KEY = ["langganan"] as const;

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function fetchLangganan(): Promise<RingkasanLangganan> {
  const res = await fetchClient("/api/langganan");
  if (!res.ok) throw await toError(res, "Gagal memuat langganan");
  return res.json();
}

export async function checkoutLangganan(
  paket: Paket,
  durasiBulan: DurasiBulan,
): Promise<{ id: number; invoiceUrl: string }> {
  const res = await fetchClient("/api/langganan/checkout", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ paket, durasiBulan }),
  });
  if (!res.ok) throw await toError(res, "Gagal membuat tagihan");
  return res.json();
}
