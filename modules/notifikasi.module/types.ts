export type TipeNotif = "IURAN_TAGIHAN" | "IURAN_LUNAS";

export interface Notifikasi {
  id: number;
  anggotaId: number;
  tipe: TipeNotif;
  judul: string;
  pesan: string;
  dibaca: boolean;
  referensiId: number;
  createdAt: string;
}
