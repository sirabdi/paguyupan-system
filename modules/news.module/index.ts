import { fetchClient, toError } from "@/lib/fetch-client";

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export interface NewsPenulis {
  id: number;
  nama: string;
  role: string;
}

export interface News {
  id: number;
  judul: string;
  konten: string;
  bannerUrl: string | null;
  penulis: NewsPenulis;
  createdAt: string;
  updatedAt: string;
  liked: boolean;
  _count: { komentar: number; like: number };
}

export interface NewsInput {
  judul: string;
  konten: string;
  bannerUrl?: string | null;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function fetchNews(q?: string): Promise<News[]> {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  const res = await fetchClient(`/api/news?${params.toString()}`);
  if (!res.ok) throw await toError(res, "Gagal memuat news");
  return res.json();
}

export async function createNews(input: NewsInput): Promise<News> {
  const res = await fetchClient("/api/news", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal membuat news");
  return res.json();
}

export async function updateNews(id: number, input: NewsInput): Promise<News> {
  const res = await fetchClient(`/api/news/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res, "Gagal memperbarui news");
  return res.json();
}

export async function deleteNews(id: number): Promise<void> {
  const res = await fetchClient(`/api/news/${id}`, { method: "DELETE" });
  if (!res.ok) throw await toError(res, "Gagal menghapus news");
}

export async function fetchNewsPaginated(filter: {
  q?: string;
  page: number;
}): Promise<PaginatedResponse<News>> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  params.set("page", String(filter.page));

  const res = await fetchClient(`/api/news?${params.toString()}`);
  if (!res.ok) throw await toError(res, "Gagal memuat news");
  return res.json();
}

export async function fetchNewsById(id: number): Promise<News> {
  const res = await fetchClient(`/api/news/${id}`);
  if (!res.ok) throw await toError(res, "Gagal memuat berita");
  return res.json();
}

export const NEWS_KEY = ["news"] as const;
