export type StatusIuran = "BELUM_BAYAR" | "LUNAS";
export type StatusIuranFilter = "ALL" | StatusIuran;

export interface Iuran {
  id: number;
  anggotaId: number;
  periode: string; // YYYY-MM
  jumlah: string;  // Decimal dikembalikan sebagai string
  status: StatusIuran;
  tanggalBayar: string | null;
  createdAt: string;
  updatedAt: string;
  anggota: { id: number; nama: string };
}

export const STATUS_IURAN_LABEL: Record<StatusIuran, string> = {
  BELUM_BAYAR: "Belum Bayar",
  LUNAS: "Lunas",
};
