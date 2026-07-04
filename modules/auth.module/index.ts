import { fetchClient, toError } from "@/lib/fetch-client";

export type Role = "ADMIN" | "SEKERTARIS" | "BENDAHARA" | "ANGGOTA";

export interface AuthUser {
  id: number;
  nama: string;
  email: string;
  role: Role;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  // Login tidak pakai fetchClient — 401 di sini berarti salah password, bukan session expired
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await toError(res, "Email atau password salah");
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await fetchClient("/api/auth/me");
  if (!res.ok) throw await toError(res, "Gagal memuat profil");
  return res.json();
}

export const ME_KEY = ["auth", "me"] as const;
