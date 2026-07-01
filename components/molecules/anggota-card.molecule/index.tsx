"use client";

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms";
import { STATUS_LABEL, type Anggota } from "@/modules/anggota.module/types";
import { formatDate } from "@/utils";

// Tampilan kartu satu anggota untuk listview (dipakai di layar kecil).
export function AnggotaCard({
  anggota,
  onEdit,
  onDelete,
}: {
  anggota: Anggota;
  onEdit: (anggota: Anggota) => void;
  onDelete: (anggota: Anggota) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{anggota.nama}</span>
          <Badge variant={anggota.status === "AKTIF" ? "default" : "secondary"}>
            {STATUS_LABEL[anggota.status]}
          </Badge>
        </div>
        <div className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
          <span className="truncate">{anggota.email || "—"}</span>
          <span>{anggota.noTelp || "—"}</span>
          {anggota.alamat && <span className="truncate">{anggota.alamat}</span>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Bergabung {formatDate(anggota.tanggalGabung)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Aksi untuk ${anggota.nama}`}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(anggota)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(anggota)}
          >
            <Trash2Icon />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
