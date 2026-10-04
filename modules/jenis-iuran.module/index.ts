import { fetchClient, toError } from "@/lib/fetch-client";

export interface JenisIuran {
  id: number;
  nama: string;
  jumlah: string; // Decimal sebagai string
  intervalBulan: number;
  isDefault: boolean;
  aktif: boolean;
}

export interface JenisIuranInput {
  nama: string;
  jumlah: number;
  intervalBulan: number;
}

export const JENIS_IURAN_KEY = ["jenis-iuran"] as const;

const JSON_HEADERS = { "Content-Type": "application/json" };

// Opsi interval (setiap berapa bulan iuran ditagihkan)
export const INTERVAL_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Setiap bulan" },
  { value: 3, label: "Setiap 3 bulan" },
  { value: 6, label: "Setiap 6 bulan" },
  { value: 12, label: "Setiap tahun" },
];

export function intervalLabel(n: number): string {
  return INTERVAL_OPTIONS.find((o) => o.value === n)?.label ?? `Setiap ${n} bulan`;
}

export async function fetchJenisIuran(): Promise<JenisIuran[]> {
  const res = await fetchClient("/api/jenis-iuran");
  if (!res.ok) throw await toError(res, "Gagal memuat jenis iuran");
  return res.json();
}

export async function createJenisIuran(input: JenisIuranInput): Promise<JenisIuran> {
  const res = await fetchClient("/api/jenis-iuran", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal membuat jenis iuran");
  return res.json();
}

export async function updateJenisIuran(
  id: number,
  input: Partial<JenisIuranInput> & { aktif?: boolean },
): Promise<JenisIuran> {
  const res = await fetchClient(`/api/jenis-iuran/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal memperbarui jenis iuran");
  return res.json();
}

export async function deleteJenisIuran(id: number): Promise<void> {
  const res = await fetchClient(`/api/jenis-iuran/${id}`, { method: "DELETE" });
  if (!res.ok) throw await toError(res, "Gagal menghapus jenis iuran");
}
