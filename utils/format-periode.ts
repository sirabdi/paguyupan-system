/**
 * Format periode "YYYY-MM" ke label bulan id-ID (mis. "2026-06" → "Juni 2026").
 * Mengembalikan input apa adanya bila format tidak valid.
 */
export function formatPeriode(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}
