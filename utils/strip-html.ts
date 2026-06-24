/**
 * Hapus tag HTML, ringkas spasi berlebih, dan trim.
 * Berguna untuk membuat preview teks dari konten rich-text (mis. berita).
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
