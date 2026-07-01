import { fetchClient, toError } from "@/lib/fetch-client";
import type { Iuran, StatusIuranFilter } from "./types";

export type { Iuran, StatusIuranFilter };
export { STATUS_IURAN_LABEL } from "./types";

export interface IuranFilter {
  periode?: string;
  status?: StatusIuranFilter;
}

export async function fetchIuran(filter: IuranFilter): Promise<Iuran[]> {
  const params = new URLSearchParams();
  if (filter.periode) params.set("periode", filter.periode);
  if (filter.status && filter.status !== "ALL") params.set("status", filter.status);

  const res = await fetchClient(`/api/iuran?${params.toString()}`);
  if (!res.ok) throw await toError(res, "Gagal memuat data iuran");
  return res.json();
}

export async function bayarIuran(id: number): Promise<Iuran> {
  const res = await fetchClient(`/api/iuran/${id}/bayar`, { method: "PATCH" });
  if (!res.ok) throw await toError(res, "Gagal menandai iuran sebagai lunas");
  return res.json();
}

export const IURAN_KEY = ["iuran"] as const;

// ── Konfigurasi: iuran bulanan default ───────────────────────────────────────

export const IURAN_DEFAULT_QUERY_KEY = ["konfigurasi", "iuran-default"] as const;

export async function fetchIuranDefault(): Promise<string> {
  const res = await fetchClient("/api/konfigurasi/iuran-default");
  if (!res.ok) throw await toError(res, "Gagal memuat konfigurasi iuran");
  return ((await res.json()) as { value: string }).value;
}

export async function updateIuranDefault(value: string): Promise<string> {
  const res = await fetchClient("/api/konfigurasi/iuran-default", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw await toError(res, "Gagal menyimpan konfigurasi iuran");
  return ((await res.json()) as { value: string }).value;
}
