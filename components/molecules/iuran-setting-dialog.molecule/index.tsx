"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/atoms";
import {
  IURAN_DEFAULT_QUERY_KEY,
  fetchIuranDefault,
  updateIuranDefault,
} from "@/modules";
import { formatRupiah } from "@/utils";

export function IuranSettingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = React.useState("");
  const [seeded, setSeeded] = React.useState<string | null>(null);

  const { data: current, isPending } = useQuery({
    queryKey: IURAN_DEFAULT_QUERY_KEY,
    queryFn: fetchIuranDefault,
    enabled: open,
  });

  // Isi input dari nilai saat ini saat dialog dibuka / data datang.
  // (menyesuaikan state selama render — pola yang direkomendasikan React)
  if (open && current !== undefined && seeded !== current) {
    setSeeded(current);
    setValue(current);
  } else if (!open && seeded !== null) {
    setSeeded(null);
  }

  const mutation = useMutation({
    mutationFn: (v: string) => updateIuranDefault(v),
    onSuccess: (saved) => {
      queryClient.setQueryData(IURAN_DEFAULT_QUERY_KEY, saved);
      toast.success("Iuran bulanan default diperbarui", {
        description:
          "Perubahan hanya berpengaruh ke tagihan yang di-generate berikutnya (tidak mengubah iuran yang sudah ada).",
        duration: 7000,
      });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saving = mutation.isPending;

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const n = Number(value);
    if (!value.trim() || !Number.isFinite(n) || n < 0) {
      toast.error("Nominal iuran tidak valid");
      return;
    }
    mutation.mutate(String(Math.round(n)));
  }

  const preview =
    value.trim() !== "" && Number.isFinite(Number(value))
      ? formatRupiah(value)
      : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Iuran Bulanan Default</DialogTitle>
            <DialogDescription>
              Nominal ini dipakai saat tagihan iuran bulanan di-generate untuk
              tiap anggota aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="iuran-default">Nominal (Rp)</Label>
            <Input
              id="iuran-default"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="50000"
              disabled={isPending}
              autoFocus
            />
            {preview && (
              <p className="text-xs text-muted-foreground">{preview}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving || isPending}>
              {saving && <Loader2Icon className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
