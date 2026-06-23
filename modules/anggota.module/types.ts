// Tipe & konstanta yang dipakai bersama oleh UI Anggota.
// Bentuk data mengikuti respons JSON dari /api/anggota.

export type StatusAnggota = "AKTIF" | "NONAKTIF";
export type Role = "ADMIN" | "BENDAHARA" | "ANGGOTA";

export interface Anggota {
  id: number;
  nama: string;
  alamat: string | null;
  noTelp: string | null;
  email: string;
  role: Role;
  status: StatusAnggota;
  tanggalGabung: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

// Label untuk ditampilkan; key = nilai yang dikirim ke API.
export const STATUS_LABEL: Record<StatusAnggota, string> = {
  AKTIF: "Aktif",
  NONAKTIF: "Nonaktif",
};
