const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/**
 * Format angka/string ke Rupiah (mis. "150000" → "Rp 150.000").
 * Mengembalikan nilai apa adanya bila bukan angka valid.
 */
export function formatRupiah(val: string | number): string {
  const n = typeof val === "number" ? val : parseFloat(val);
  return Number.isNaN(n) ? String(val) : rupiahFormatter.format(n);
}
