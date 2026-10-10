import { fetchClient, toError } from "@/lib/fetch-client";
import type { Paket } from "@/modules/langganan.module/paket";

export type TipeKomunitas = "RT" | "RW" | "BLOK" | "CUSTOM";
export type StatusKomunitas = "MENUNGGU_PEMBAYARAN" | "AKTIF" | "SUSPEND";

export const TIPE_LABEL: Record<TipeKomunitas, string> = {
  RT: "RT",
  RW: "RW",
  BLOK: "Blok",
  CUSTOM: "Custom",
};

export const STATUS_LABEL: Record<StatusKomunitas, string> = {
  MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
  AKTIF: "Aktif",
  SUSPEND: "Suspend",
};

export interface Komunitas {
  id: number;
  nama: string;
  tipe: TipeKomunitas;
  paket: Paket | null;
  kuotaAnggota: number;
  status: StatusKomunitas;
  expiredAt: string | null;
  alamatInduk: string | null;
  maxIuranTambahan: number;
  _count: { anggota: number };
  createdAt: string;
  updatedAt: string;
}

// Superadmin hanya mengelola komunitas yang mendaftar sendiri (tidak membuat baru).
export interface KomunitasInput {
  nama: string;
  tipe: TipeKomunitas;
  alamatInduk: string | null;
  status: StatusKomunitas;
  paket: Paket | null;
  expiredAt: string | null; // ISO
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function fetchKomunitas(): Promise<Komunitas[]> {
  const res = await fetchClient("/api/komunitas");
  if (!res.ok) throw await toError(res, "Gagal memuat komunitas");
  return res.json();
}

export async function updateKomunitas(id: number, input: Partial<KomunitasInput>): Promise<Komunitas> {
  const res = await fetchClient(`/api/komunitas/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal memperbarui komunitas");
  return res.json();
}

export async function deleteKomunitas(id: number): Promise<void> {
  const res = await fetchClient(`/api/komunitas/${id}`, { method: "DELETE" });
  if (!res.ok) throw await toError(res, "Gagal menghapus komunitas");
}

export const KOMUNITAS_KEY = ["komunitas"] as const;
