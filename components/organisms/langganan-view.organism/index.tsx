"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PhoneIcon,
  ShieldAlertIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
} from "@/components/atoms";
import { LogoutButton } from "@/components/molecules";
import {
  DURASI_OPTIONS,
  LANGGANAN_KEY,
  PAKET,
  PAKET_LIST,
  STATUS_TAMPIL_LABEL,
  checkoutLangganan,
  durasiLabel,
  fetchLangganan,
  statusTampil,
  type DurasiBulan,
  type Paket,
  type RingkasanLangganan,
  type StatusTampil,
} from "@/modules";
import { formatDateLong, formatDateNumeric, formatRupiah } from "@/utils";

const STATUS_STYLE: Record<StatusTampil, string> = {
  AKTIF: "bg-green-50 text-green-700",
  MENUNGGU_PEMBAYARAN: "bg-amber-50 text-amber-700",
  KEDALUWARSA: "bg-red-50 text-red-700",
  SUSPEND: "bg-red-50 text-red-700",
};

const BAYAR_STATUS: Record<"PENDING" | "PAID" | "EXPIRED", { label: string; cls: string }> = {
  PENDING: { label: "Menunggu", cls: "bg-amber-50 text-amber-700" },
  PAID: { label: "Lunas", cls: "bg-green-50 text-green-700" },
  EXPIRED: { label: "Kedaluwarsa", cls: "bg-zinc-100 text-zinc-500" },
};

function waLink(noTelp: string): string {
  const digits = noTelp.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${digits}`;
}

export function LanggananView({
  initialData,
  isAdmin,
}: {
  initialData: RingkasanLangganan;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembaliDariBayar = searchParams.get("bayar") === "sukses";

  // Setelah redirect dari Xendit, webhook bisa sedikit terlambat → polling sampai aktif (maks 2 menit)
  const [timeout, setTimeoutHabis] = React.useState(false);
  const { data } = useQuery({
    queryKey: [...LANGGANAN_KEY],
    queryFn: fetchLangganan,
    initialData,
    refetchInterval: (q) => {
      const d = q.state.data;
      const selesai = d && statusTampil(d.komunitas) === "AKTIF" && d.riwayat?.[0]?.status === "PAID";
      return kembaliDariBayar && !timeout && !selesai ? 3000 : false;
    },
  });

  const status = statusTampil(data.komunitas);
  const aktif = status === "AKTIF";
  const lunasTerbaru = data.riwayat?.[0]?.status === "PAID";
  const menungguWebhook = kembaliDariBayar && !timeout && !(aktif && lunasTerbaru);

  React.useEffect(() => {
    if (!kembaliDariBayar) return;
    if (aktif && lunasTerbaru) {
      toast.success("Pembayaran berhasil. Langganan aktif!");
      router.replace("/langganan");
      return;
    }
    const t = setTimeout(() => setTimeoutHabis(true), 120_000);
    return () => clearTimeout(t);
  }, [kembaliDariBayar, aktif, lunasTerbaru, router]);

  React.useEffect(() => {
    if (searchParams.get("bayar") === "gagal") toast.error("Pembayaran dibatalkan atau gagal.");
  }, [searchParams]);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex flex-col gap-5">
        <BannerStatus data={data} status={status} isAdmin={isAdmin} />
        <StatusCard data={data} status={status} />

        {menungguWebhook && (
          <div className="flex items-center gap-3 rounded-sm bg-blue-50 p-4 text-sm text-blue-700">
            <Loader2Icon className="size-4 shrink-0 animate-spin" />
            Memverifikasi pembayaran Anda…
          </div>
        )}

        {status === "SUSPEND" ? (
          <Notice icon={<ShieldAlertIcon className="size-5 text-red-600" />}>
            Komunitas ini sedang ditangguhkan oleh pengelola layanan. Silakan hubungi pengelola
            Paguyupan untuk informasi lebih lanjut.
          </Notice>
        ) : !isAdmin ? (
          <HubungiAdmin admin={data.admin} />
        ) : (
          <PilihPaket data={data} status={status} />
        )}

        {isAdmin && data.riwayat && data.riwayat.length > 0 && <Riwayat riwayat={data.riwayat} />}

        {!aktif && (
          <div className="flex justify-center">
            <LogoutButton />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status ────────────────────────────────────────────────────────────────────

/** H-7 s/d H-1 = masa pengingat (sama dengan email pengingat & konfirmasi perpanjang). */
const BATAS_PENGINGAT_HARI = 7;

const BANNER_STYLE = {
  hijau: "bg-green-50 text-green-800 ring-green-200",
  kuning: "bg-amber-50 text-amber-800 ring-amber-200",
  merah: "bg-red-50 text-red-800 ring-red-200",
} as const;

function BannerStatus({
  data,
  status,
  isAdmin,
}: {
  data: RingkasanLangganan;
  status: StatusTampil;
  isAdmin: boolean;
}) {
  const k = data.komunitas;
  const tanggal = k.expiredAt ? formatDateLong(k.expiredAt) : "";
  const namaPaket = k.paket ? PAKET[k.paket].label : "";

  let warna: keyof typeof BANNER_STYLE;
  let icon: React.ReactNode;
  let judul: string;
  let isi: React.ReactNode;

  if (status === "AKTIF") {
    // Anggota biasa tidak bisa membuka halaman ini saat aktif; tetap dijaga di sini
    if (!isAdmin || k.sisaHari === null) return null;
    if (k.sisaHari > BATAS_PENGINGAT_HARI) {
      warna = "hijau";
      icon = <CheckCircle2Icon className="size-5" />;
      judul = "Langganan aktif";
      isi = (
        <>
          Paket {namaPaket} berlaku hingga <strong>{tanggal}</strong> ({k.sisaHari} hari lagi).
        </>
      );
    } else {
      warna = "kuning";
      icon = <ClockIcon className="size-5" />;
      judul = k.sisaHari <= 1 ? "Langganan berakhir besok" : `Langganan berakhir dalam ${k.sisaHari} hari`;
      isi = (
        <>
          Masa aktif paket {namaPaket} habis pada <strong>{tanggal}</strong>. Perpanjang sekarang agar seluruh
          anggota tetap bisa menggunakan aplikasi.
        </>
      );
    }
  } else if (status === "KEDALUWARSA") {
    warna = "merah";
    icon = <XCircleIcon className="size-5" />;
    judul = "Langganan telah berakhir";
    isi = isAdmin ? (
      <>
        Masa aktif berakhir sejak <strong>{tanggal}</strong>. Pilih paket di bawah untuk mengaktifkan kembali.
      </>
    ) : (
      <>
        Masa aktif berakhir sejak <strong>{tanggal}</strong>. Hubungi Admin untuk memperpanjang.
      </>
    );
  } else if (status === "MENUNGGU_PEMBAYARAN") {
    warna = "kuning";
    icon = <AlertTriangleIcon className="size-5" />;
    judul = "Menunggu pembayaran";
    isi = isAdmin
      ? "Pilih paket dan selesaikan pembayaran untuk mulai menggunakan aplikasi."
      : "Langganan komunitas belum aktif. Hubungi Admin untuk menyelesaikan pembayaran.";
  } else {
    return null; // SUSPEND punya notice sendiri
  }

  return (
    <div className={`flex items-start gap-3 rounded-sm p-4 ring-1 ${BANNER_STYLE[warna]}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{judul}</p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-90">{isi}</p>
      </div>
    </div>
  );
}

function StatusCard({ data, status }: { data: RingkasanLangganan; status: StatusTampil }) {
  const k = data.komunitas;

  return (
    <div className="rounded-sm bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-zinc-400">Komunitas</p>
          <p className="truncate font-semibold text-zinc-900">{k.nama}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status]}`}>
          {STATUS_TAMPIL_LABEL[status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
        <div>
          <p className="text-sm font-bold text-zinc-900">{k.paket ? PAKET[k.paket].label : "—"}</p>
          <p className="text-[10px] text-zinc-400">Paket</p>
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">
            {k.jumlahAkun}/{k.paket ? k.kuotaAnggota : "—"}
          </p>
          <p className="text-[10px] text-zinc-400">Akun</p>
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">{formatDateNumeric(k.expiredAt)}</p>
          <p className="text-[10px] text-zinc-400">Berlaku hingga</p>
        </div>
      </div>
    </div>
  );
}

function Notice({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm bg-white p-6 text-center shadow-sm ring-1 ring-zinc-100">
      <div className="flex size-10 items-center justify-center rounded-full bg-zinc-50">{icon}</div>
      <p className="text-sm text-zinc-600">{children}</p>
    </div>
  );
}

// ── Non-admin ─────────────────────────────────────────────────────────────────

function HubungiAdmin({ admin }: { admin: RingkasanLangganan["admin"] }) {
  return (
    <div className="flex flex-col gap-3">
      <Notice icon={<UsersIcon className="size-5 text-amber-600" />}>
        Langganan komunitas sedang tidak aktif. Silakan <strong>hubungi Admin</strong> komunitas Anda
        untuk melakukan pembayaran.
      </Notice>
      {admin.length > 0 && (
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-100">
          {admin.map((a) => (
            <div key={a.email} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{a.nama}</p>
                <p className="truncate text-xs text-zinc-400">{a.noTelp ?? a.email}</p>
              </div>
              {a.noTelp && (
                <a
                  href={waLink(a.noTelp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  <PhoneIcon className="size-3" />
                  WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin: pilih paket & bayar ────────────────────────────────────────────────


function PilihPaket({ data, status }: { data: RingkasanLangganan; status: StatusTampil }) {
  const k = data.komunitas;
  const [paket, setPaket] = React.useState<Paket>(k.paket ?? "BASIC");
  const [durasi, setDurasi] = React.useState<DurasiBulan>(12);

  const harga = PAKET[paket].harga[durasi];
  const hargaBulanan = PAKET[paket].harga[1];
  const hemat = hargaBulanan * durasi - harga;
  const estimasi = data.estimasi?.[paket][durasi];
  const melebihiKuota = k.jumlahAkun > PAKET[paket].kuotaAnggota;
  const aksi =
    status !== "AKTIF" || !k.paket ? "Bayar" : paket === k.paket ? "Perpanjang" : "Ganti Paket";

  // Perpanjang saat masih aktif → konfirmasi dulu (jatuh tempo mungkin masih lama)
  const [konfirmasiOpen, setKonfirmasiOpen] = React.useState(false);
  const sisaHari = k.sisaHari ?? 0;
  // Perpanjang lebih awal dari masa pengingat (H-7 s/d H-1) → perlu konfirmasi
  const perluKonfirmasi = aksi === "Perpanjang" && sisaHari > BATAS_PENGINGAT_HARI;

  function handleBayar() {
    if (perluKonfirmasi) setKonfirmasiOpen(true);
    else checkout.mutate();
  }

  const checkout = useMutation({
    mutationFn: () => checkoutLangganan(paket, durasi),
    onSuccess: (res) => {
      window.location.href = res.invoiceUrl;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Pilih Paket</p>
        <div className="flex flex-col gap-2">
          {PAKET_LIST.map((p) => {
            const info = PAKET[p];
            const selected = p === paket;
            const tidakMuat = k.jumlahAkun > info.kuotaAnggota;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPaket(p)}
                className={`flex items-center gap-3 rounded-sm bg-white p-3 text-left ring-1 transition-colors ${
                  selected ? "ring-2 ring-primary" : "ring-zinc-200 hover:ring-zinc-300"
                }`}
              >
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-primary bg-primary text-white" : "border-zinc-300"
                  }`}
                >
                  {selected && <CheckIcon className="size-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900">{info.label}</p>
                    {k.paket === p && status === "AKTIF" && <Badge variant="secondary">Paket saat ini</Badge>}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {info.kuotaAnggota} akun · {info.maxIuranTambahan} iuran tambahan
                  </p>
                  {tidakMuat && (
                    <p className="text-[11px] text-red-600">Jumlah akun Anda ({k.jumlahAkun}) melebihi kuota</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-zinc-900">{formatRupiah(info.harga[1])}</p>
                  <p className="text-[10px] text-zinc-400">/bulan</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Durasi</p>
        <div className="grid grid-cols-3 gap-2">
          {DURASI_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDurasi(d.value)}
              className={`rounded-sm px-2 py-2 text-xs font-medium ring-1 transition-colors ${
                d.value === durasi
                  ? "bg-primary text-white ring-primary"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:ring-zinc-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-sm bg-white p-4 shadow-sm ring-1 ring-zinc-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            {PAKET[paket].label} · {durasiLabel(durasi)}
          </span>
          <span className="font-bold text-zinc-900">{formatRupiah(harga)}</span>
        </div>
        {hemat > 0 && (
          <p className="mt-1 text-right text-xs text-green-600">Hemat {formatRupiah(hemat)}</p>
        )}
        {estimasi && (
          <div className="mt-3 border-t pt-3 text-xs text-zinc-500">
            <p>
              Berlaku hingga <span className="font-medium text-zinc-800">{formatDateLong(estimasi.periodeSelesai)}</span>
            </p>
            {estimasi.bonusHari > 0 && (
              <p className="mt-1 text-green-700">
                Termasuk +{estimasi.bonusHari} hari dari sisa nilai paket {k.paket ? PAKET[k.paket].label : ""} Anda.
              </p>
            )}
            <p className="mt-1 text-[11px] text-zinc-400">Estimasi; dihitung final saat pembayaran diterima.</p>
          </div>
        )}

        <Button
          className="mt-4 h-10 w-full text-sm font-semibold"
          disabled={checkout.isPending || melebihiKuota}
          onClick={handleBayar}
        >
          {checkout.isPending && <Loader2Icon className="animate-spin" />}
          {aksi} {formatRupiah(harga)}
        </Button>
        {melebihiKuota && (
          <p className="mt-2 text-center text-xs text-red-600">
            Kurangi {k.jumlahAkun - PAKET[paket].kuotaAnggota} akun untuk memilih paket ini.
          </p>
        )}
        <p className="mt-2 text-center text-[11px] text-zinc-400">
          Pembayaran diproses oleh Xendit (VA, QRIS, e-wallet, retail).
        </p>
      </div>

      <AlertDialog
        open={konfirmasiOpen}
        onOpenChange={(open) => {
          if (!checkout.isPending) setKonfirmasiOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Langganan Anda masih aktif</AlertDialogTitle>
            <AlertDialogDescription>
              Paket {k.paket ? PAKET[k.paket].label : ""} Anda masih berlaku hingga{" "}
              <span className="font-medium text-foreground">
                {k.expiredAt ? formatDateLong(k.expiredAt) : "—"}
              </span>{" "}
              ({sisaHari} hari lagi). Jatuh tempo masih lama — yakin mau perpanjang sekarang?
              {estimasi && (
                <>
                  {" "}Jika dibayar, langganan berlaku hingga{" "}
                  <span className="font-medium text-foreground">{formatDateLong(estimasi.periodeSelesai)}</span>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={checkout.isPending}>Nanti saja</AlertDialogCancel>
            <AlertDialogAction onClick={() => checkout.mutate()} disabled={checkout.isPending}>
              {checkout.isPending && <Loader2Icon className="animate-spin" />}
              Ya, Perpanjang {formatRupiah(harga)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Riwayat ───────────────────────────────────────────────────────────────────

function Riwayat({ riwayat }: { riwayat: NonNullable<RingkasanLangganan["riwayat"]> }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Riwayat Pembayaran</p>
      <div className="divide-y divide-zinc-100 overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-100">
        {riwayat.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900">
                {PAKET[r.paket].label} · {durasiLabel(r.durasiBulan)}
              </p>
              <p className="truncate text-xs text-zinc-400">
                {formatDateLong(r.paidAt ?? r.createdAt)}
                {r.metode ? ` · ${r.metode}` : ""}
                {r.bonusHari > 0 ? ` · +${r.bonusHari} hari` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="text-sm font-semibold text-zinc-900">{formatRupiah(r.harga)}</p>
              {r.invoiceUrl ? (
                <a
                  href={r.invoiceUrl}
                  className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                >
                  Lanjutkan bayar
                  <ExternalLinkIcon className="size-3" />
                </a>
              ) : (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BAYAR_STATUS[r.status].cls}`}>
                  {r.status === "PAID" && <CheckCircle2Icon className="mr-0.5 inline size-3" />}
                  {BAYAR_STATUS[r.status].label}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
