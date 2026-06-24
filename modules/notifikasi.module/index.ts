import type { Notifikasi } from "./types";

export type { Notifikasi };
export type { TipeNotif } from "./types";

async function toError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return new Error(body?.error ?? fallback);
}

export async function fetchNotifikasi(): Promise<Notifikasi[]> {
  const res = await fetch("/api/notifikasi");
  if (!res.ok) throw await toError(res, "Gagal memuat notifikasi");
  return res.json();
}

export async function bacaSemua(): Promise<void> {
  const res = await fetch("/api/notifikasi/baca-semua", { method: "PATCH" });
  if (!res.ok) throw await toError(res, "Gagal menandai notifikasi");
}

export const NOTIF_KEY = ["notifikasi"] as const;
