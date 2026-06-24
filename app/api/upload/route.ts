import { NextResponse } from "next/server";
import { extname } from "path";
import { requireNewsEditor } from "@/lib/auth";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function saveFile(file: File, filename: string): Promise<string> {
  if (process.env.VERCEL) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${filename}`, file, { access: "public" });
    return blob.url;
  }

  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

// POST /api/upload  — hanya Admin & Sekertaris
export async function POST(req: Request) {
  const auth = await requireNewsEditor();
  if (!auth.ok) return auth.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Gagal membaca form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Field 'file' wajib diisi" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Hanya file gambar (JPEG, PNG, WebP, GIF, AVIF) yang diizinkan" },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 413 });
  }

  const ext = extname(file.name) || `.${file.type.split("/")[1]}`;
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;

  const url = await saveFile(file, filename);
  return NextResponse.json({ url }, { status: 201 });
}
