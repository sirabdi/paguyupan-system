import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, komunitasFilter } from "@/lib/auth";

// GET /api/iuran?periode=2026-06&status=BELUM_BAYAR&page=1 — semua role login
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode");
  const status = searchParams.get("status");
  const pageStr = searchParams.get("page");

  const where: Prisma.IuranWhereInput = {
    ...komunitasFilter(auth.session),
    ...(periode ? { periode } : {}),
    ...(status === "BELUM_BAYAR" || status === "LUNAS" ? { status } : {}),
  };
  const include = { anggota: { select: { id: true, nama: true } } } as const;
  const orderBy = [{ periode: "desc" as const }, { anggotaId: "asc" as const }];

  if (pageStr !== null) {
    const page = Math.max(1, Number(pageStr) || 1);
    const pageSize = 5;
    const [data, total] = await Promise.all([
      prisma.iuran.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.iuran.count({ where }),
    ]);
    return NextResponse.json({
      data,
      page,
      page_size: pageSize,
      total,
      has_more: page * pageSize < total,
    });
  }

  const iuran = await prisma.iuran.findMany({ where, include, orderBy });
  return NextResponse.json(iuran);
}
