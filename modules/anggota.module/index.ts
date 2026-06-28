// Lapisan akses data untuk /api/anggota.
// Setiap fungsi melempar Error berisi pesan dari API agar bisa ditampilkan
// langsung oleh TanStack Query (onError) / toast.

import { fetchClient, toError } from "@/lib/fetch-client";
import type { Anggota, StatusAnggota } from "./types";

export type StatusFilter = "ALL" | StatusAnggota;

export interface AnggotaFilter {
  q?: string;
  status?: StatusFilter;
}

export interface AnggotaInput {
  nama: string;
  email: string;
  password?: string;
  noTelp: string;
  alamat: string;
  status: StatusAnggota;
  role?: import("./types").Role;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function fetchAnggota(filter: AnggotaFilter): Promise<Anggota[]> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status && filter.status !== "ALL") {
    params.set("status", filter.status);
  }

  const res = await fetchClient(`/api/anggota?${params.toString()}`);
  if (!res.ok) throw await toError(res, "Gagal memuat data anggota");
  return res.json();
}

export async function createAnggota(input: AnggotaInput): Promise<Anggota> {
  const res = await fetchClient("/api/anggota", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal menambah anggota");
  return res.json();
}

export async function updateAnggota(
  id: number,
  input: AnggotaInput,
): Promise<Anggota> {
  const res = await fetchClient(`/api/anggota/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal memperbarui anggota");
  return res.json();
}

export async function deleteAnggota(id: number): Promise<void> {
  const res = await fetchClient(`/api/anggota/${id}`, { method: "DELETE" });
  if (!res.ok) throw await toError(res, "Gagal menghapus anggota");
}

// Key dasar untuk semua query anggota — dipakai saat invalidasi cache.
export const ANGGOTA_KEY = ["anggota"] as const;
