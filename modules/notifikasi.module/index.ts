import { fetchClient, toError } from "@/lib/fetch-client";
import type { Notifikasi } from "./types";

export type { Notifikasi };
export type { TipeNotif } from "./types";

export async function fetchNotifikasi(): Promise<Notifikasi[]> {
  const res = await fetchClient("/api/notifikasi");
  if (!res.ok) throw await toError(res, "Gagal memuat notifikasi");
  return res.json();
}

export async function bacaSemua(): Promise<void> {
  const res = await fetchClient("/api/notifikasi/baca-semua", { method: "PATCH" });
  if (!res.ok) throw await toError(res, "Gagal menandai notifikasi");
}

export const NOTIF_KEY = ["notifikasi"] as const;
