import "server-only";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Paguyupan" <no-reply@paguyupan.id>`,
    to,
    subject: "Kode Verifikasi Email — Paguyupan",
    text: `Kode OTP Anda: ${code}\n\nKode ini berlaku selama 10 menit. Jangan bagikan kepada siapapun.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1d4ed8">Verifikasi Email</h2>
        <p>Gunakan kode berikut untuk memverifikasi email Anda:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;margin:24px 0">${code}</div>
        <p style="color:#6b7280;font-size:14px">Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kepada siapapun.</p>
      </div>
    `,
  });
}
