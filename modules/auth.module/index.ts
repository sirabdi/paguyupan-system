export type Role = "ADMIN" | "SEKERTARIS" | "BENDAHARA" | "ANGGOTA";

export interface AuthUser {
  id: number;
  nama: string;
  email: string;
  role: Role;
}

async function toError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return new Error(body?.error ?? fallback);
}

export async function login(email: string, password: string): Promise<AuthUser> {
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
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw await toError(res, "Gagal memuat profil");
  return res.json();
}

export const ME_KEY = ["auth", "me"] as const;
