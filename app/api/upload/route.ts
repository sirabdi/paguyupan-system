import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { requireNewsEditor } from "@/lib/auth";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
