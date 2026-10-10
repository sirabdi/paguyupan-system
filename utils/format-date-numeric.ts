/**
 * Format tanggal ISO ke "dd/mm/yyyy" (mis. "10/11/2026").
 * Mengembalikan "—" untuk nilai kosong/null atau tanggal tidak valid.
 */
export function formatDateNumeric(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}
