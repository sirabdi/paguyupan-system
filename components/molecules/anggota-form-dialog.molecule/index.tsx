"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/atoms";

import {
  ANGGOTA_KEY,
  createAnggota,
  updateAnggota,
  type AnggotaInput,
} from "@/modules";
import {
  STATUS_LABEL,
  type Anggota,
  type Role,
  type StatusAnggota,
} from "@/modules/anggota.module/types";
import { useAnggotaForm } from "@/modules/anggota.module/anggota.form";
import { ROLE_LABEL } from "@/utils";

export function AnggotaFormDialog({
  open,
  onOpenChange,
  anggota,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anggota?: Anggota | null;
  currentUserId?: number;
}) {
  const isEdit = Boolean(anggota);
  const canEditPassword = !isEdit || anggota?.id === currentUserId;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useAnggotaForm(open, anggota);

  const mutation = useMutation({
    mutationFn: (input: AnggotaInput) =>
      isEdit ? updateAnggota(anggota!.id, input) : createAnggota(input),
    onSuccess: (saved) => {
      toast.success(
        isEdit
          ? "Data anggota diperbarui"
          : `Anggota "${saved.nama}" ditambahkan`,
      );
      queryClient.invalidateQueries({ queryKey: ANGGOTA_KEY });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saving = mutation.isPending;
  const disabled = saving || !isValid;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-lg">
        <form
          onSubmit={handleSubmit((data) => {
            mutation.mutate({
              nama: data.nama,
              email: data.email,
              noTelp: data.noTelp ?? "",
              alamat: data.alamat ?? "",
              status: data.status as StatusAnggota,
              role: data.role as Role,
              ...(data.password ? { password: data.password } : {}),
            });
          })}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {isEdit ? "Edit Anggota" : "Tambah Anggota"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Perbarui data anggota. Kosongkan password jika tidak ingin mengubahnya."
                : "Isi data anggota baru. Password minimal 8 karakter."}
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-1 grid min-h-0 flex-1 gap-4 overflow-y-auto px-1">
          <div className="grid gap-2">
            <Label htmlFor="nama">
              Nama <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama"
              placeholder="Nama lengkap"
              autoFocus
              {...register("nama")}
            />
            {errors.nama && (
              <p className="text-xs text-destructive">{errors.nama.message}</p>
            )}
          </div>

          <div className="grid items-start gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="noTelp">No. Telepon</Label>
              <Input
                id="noTelp"
                inputMode="tel"
                placeholder="08xxxxxxxxxx"
                {...register("noTelp")}
              />
            </div>
          </div>

          {canEditPassword && (
            <div className="grid gap-2">
              <Label htmlFor="password">
                Password
                {!isEdit && <span className="text-destructive"> *</span>}
                {isEdit && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (kosongkan jika tidak diubah)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEdit ? "••••••••" : "Min. 8 karakter"}
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) => (value ? ROLE_LABEL[value as Role] : "")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">{ROLE_LABEL.ADMIN}</SelectItem>
                      <SelectItem value="SEKERTARIS">
                        {ROLE_LABEL.SEKERTARIS}
                      </SelectItem>
                      <SelectItem value="BENDAHARA">
                        {ROLE_LABEL.BENDAHARA}
                      </SelectItem>
                      <SelectItem value="ANGGOTA">
                        {ROLE_LABEL.ANGGOTA}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) =>
                          value ? STATUS_LABEL[value as StatusAnggota] : ""
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">
                        {STATUS_LABEL.AKTIF}
                      </SelectItem>
                      <SelectItem value="NONAKTIF">
                        {STATUS_LABEL.NONAKTIF}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea
              id="alamat"
              placeholder="Alamat domisili"
              rows={3}
              {...register("alamat")}
            />
          </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={disabled}>
              {saving && <Loader2Icon className="animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
