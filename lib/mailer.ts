import "server-only";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  // Tanpa SMTP_USER (mis. MailHog di development) → kirim tanpa autentikasi
  ...(process.env.SMTP_USER
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
    : {}),
});

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Paguyupan <no-reply@paguyupan.id>",
    to,
    subject: "Kode Verifikasi — Paguyupan",
    text: `Kode OTP Anda: ${code}\n\nKode ini berlaku selama 10 menit. Jangan bagikan kepada siapapun.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1d4ed8">Kode Verifikasi</h2>
        <p>Gunakan kode berikut:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;margin:24px 0">${code}</div>
        <p style="color:#6b7280;font-size:14px">Berlaku <strong>10 menit</strong>. Jangan bagikan kepada siapapun.</p>
      </div>
    `,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendPengingatLanggananEmail(
  to: string,
  data: { nama: string; komunitas: string; sisaHari: number; expiredAt: Date; url: string },
): Promise<void> {
  const tanggal = data.expiredAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const kapan = data.sisaHari <= 1 ? "besok" : `dalam ${data.sisaHari} hari`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Paguyupan <no-reply@paguyupan.id>",
    to,
    subject: `Langganan ${data.komunitas} berakhir ${kapan} — Paguyupan`,
    text:
      `Halo ${data.nama},\n\nLangganan Paguyupan untuk komunitas ${data.komunitas} akan berakhir ${kapan} (${tanggal}).\n` +
      `Setelah itu, seluruh anggota tidak dapat menggunakan aplikasi sampai langganan diperpanjang.\n\n` +
      `Perpanjang sekarang: ${data.url}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1d4ed8">Langganan segera berakhir</h2>
        <p>Halo ${escapeHtml(data.nama)},</p>
        <p>Langganan Paguyupan untuk komunitas <strong>${escapeHtml(data.komunitas)}</strong> akan berakhir
          <strong>${kapan}</strong> (${tanggal}).</p>
        <p>Setelah itu, seluruh anggota tidak dapat menggunakan aplikasi sampai langganan diperpanjang.</p>
        <p style="margin:24px 0">
          <a href="${data.url}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Perpanjang Langganan</a>
        </p>
      </div>
    `,
  });
}
