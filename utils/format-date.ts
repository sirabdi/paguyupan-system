const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

/**
 * Format tanggal ISO ke gaya "medium" id-ID (mis. "24 Jun 2026").
 * Mengembalikan "—" untuk nilai kosong/null atau tanggal tidak valid.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
}
