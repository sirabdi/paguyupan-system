/**
 * Format tanggal ISO ke format panjang id-ID (mis. "1 Januari 2026").
 * Mengembalikan "-" untuk nilai kosong/null.
 */
export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
