import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getIuranDefault, setIuranDefault } from "@/lib/konfigurasi";

// GET /api/konfigurasi/iuran-default — nilai iuran bulanan default.
// Hanya Admin & Bendahara.
export async function GET() {
  const auth = await requireRole("ADMIN", "BENDAHARA");
  if (!auth.ok) return auth.response;

  const value = await getIuranDefault();
  return NextResponse.json({ value });
}

// PUT /api/konfigurasi/iuran-default — ubah nilai. Body: { value }
// Hanya Admin & Bendahara.
export async function PUT(req: Request) {
  const auth = await requireRole("ADMIN", "BENDAHARA");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON yang valid" },
      { status: 400 },
    );
  }

  const raw = (body as { value?: unknown } | null)?.value;
  const value =
    typeof raw === "string" || typeof raw === "number" ? String(raw).trim() : "";
  const n = Number(value);
  if (value === "" || !Number.isFinite(n) || n < 0) {
    return NextResponse.json(
      { error: "Nominal iuran tidak valid" },
      { status: 400 },
    );
  }

  // Simpan sebagai bilangan bulat (rupiah, tanpa desimal).
  const saved = await setIuranDefault(String(Math.round(n)));
  return NextResponse.json({ value: saved });
}
