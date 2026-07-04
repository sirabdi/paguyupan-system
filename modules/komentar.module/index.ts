import { fetchClient, toError } from "@/lib/fetch-client";

export interface KomentarPenulis {
  id: number;
  nama: string;
  role: string;
}

export interface KomentarReply {
  id: number;
  konten: string;
  createdAt: string;
  penulis: KomentarPenulis;
}

export interface Komentar {
  id: number;
  konten: string;
  createdAt: string;
  penulis: KomentarPenulis;
  replies: KomentarReply[];
}

export function komentarKey(newsId: number) {
  return ["komentar", newsId] as const;
}

export async function fetchKomentar(newsId: number): Promise<Komentar[]> {
  const res = await fetchClient(`/api/news/${newsId}/komentar`);
  if (!res.ok) throw await toError(res, "Gagal memuat komentar");
  return res.json();
}

export async function postKomentar(
  newsId: number,
  konten: string,
  parentId?: number,
  targetId?: number,
): Promise<KomentarReply> {
  const res = await fetchClient(`/api/news/${newsId}/komentar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ konten, parentId, targetId }),
  });
  if (!res.ok) throw await toError(res, "Gagal mengirim komentar");
  return res.json();
}

export async function deleteKomentar(id: number): Promise<void> {
  const res = await fetchClient(`/api/komentar/${id}`, { method: "DELETE" });
  if (!res.ok) throw await toError(res, "Gagal menghapus komentar");
}

export async function toggleLike(newsId: number): Promise<{ liked: boolean; count: number }> {
  const res = await fetchClient(`/api/news/${newsId}/like`, { method: "POST" });
  if (!res.ok) throw await toError(res, "Gagal memproses like");
  return res.json();
}

export const LIKE_KEY = (newsId: number) => ["like", newsId] as const;
