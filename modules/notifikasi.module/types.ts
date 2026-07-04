export type TipeNotif =
  | "IURAN_TAGIHAN"
  | "IURAN_LUNAS"
  | "KOMENTAR_ARTIKEL"
  | "KOMENTAR_BALASAN";

export interface Notifikasi {
  id: number;
  anggotaId: number;
  tipe: TipeNotif;
  judul: string;
  pesan: string;
  dibaca: boolean;
  referensiId: number;
  newsId: number | null;
  createdAt: string;
}
