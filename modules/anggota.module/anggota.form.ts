import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnggotaCreateSchema, AnggotaEditSchema, type AnggotaFormDTO } from "./dto";
import type { Anggota } from "./types";

const EMPTY: AnggotaFormDTO = {
  nama: "",
  email: "",
  password: "",
  noTelp: "",
  alamat: "",
  role: "ANGGOTA",
  status: "AKTIF",
};

function toFormValues(anggota: Anggota): AnggotaFormDTO {
  return {
    nama: anggota.nama,
    email: anggota.email,
    password: "",
    noTelp: anggota.noTelp ?? "",
    alamat: anggota.alamat ?? "",
    role: anggota.role,
    status: anggota.status,
  };
}

export function useAnggotaForm(open: boolean, anggota?: Anggota | null) {
  const isEdit = Boolean(anggota);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<AnggotaFormDTO, any, AnggotaFormDTO>({
    defaultValues: EMPTY,
    mode: "onTouched",
    // @ts-expect-error zod v4 resolver union type — runtime behavior is correct
    resolver: zodResolver(isEdit ? AnggotaEditSchema : AnggotaCreateSchema),
  });

  useEffect(() => {
    if (open) {
      form.reset(anggota ? toFormValues(anggota) : EMPTY);
    }
  }, [open, anggota]); // eslint-disable-line react-hooks/exhaustive-deps

  return form;
}
