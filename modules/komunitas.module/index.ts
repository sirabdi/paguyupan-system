import { fetchClient, toError } from "@/lib/fetch-client";

export type TipeKomunitas = "RT" | "RW" | "BLOK" | "CUSTOM";
export type StatusKomunitas = "TRIAL" | "AKTIF" | "SUSPEND";

export const TIPE_LABEL: Record<TipeKomunitas, string> = {
  RT: "RT",
  RW: "RW",
  BLOK: "Blok",
  CUSTOM: "Custom",
};

export const STATUS_LABEL: Record<StatusKomunitas, string> = {
  TRIAL: "Trial",
  AKTIF: "Aktif",
  SUSPEND: "Suspend",
};

export interface Komunitas {
  id: number;
  nama: string;
  tipe: TipeKomunitas;
  kode: string | null;
  kuotaAnggota: number;
  durasiHari: number | null;
  status: StatusKomunitas;
  expiredAt: string | null;
  alamatInduk: string | null;
  _count: { anggota: number };
  createdAt: string;
  updatedAt: string;
}

export interface KomunitasInput {
  nama: string;
  tipe: TipeKomunitas;
  kode?: string | null;
  kuotaAnggota: number;
  durasiHari?: number | null;
  status?: StatusKomunitas;
  alamatInduk?: string | null;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function fetchKomunitas(): Promise<Komunitas[]> {
  const res = await fetchClient("/api/komunitas");
  if (!res.ok) throw await toError(res, "Gagal memuat komunitas");
  return res.json();
}

export async function createKomunitas(input: KomunitasInput): Promise<Komunitas> {
  const res = await fetchClient("/api/komunitas", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal membuat komunitas");
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

export interface AdminInput {
  nama: string;
  email: string;
  password: string;
  noTelp?: string;
  alamat?: string;
}

export async function createKomunitasAdmin(komunitasId: number, input: AdminInput): Promise<{ id: number; nama: string; email: string }> {
  const res = await fetchClient(`/api/komunitas/${komunitasId}/admin`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal membuat admin");
  return res.json();
}

export const KOMUNITAS_KEY = ["komunitas"] as const;
