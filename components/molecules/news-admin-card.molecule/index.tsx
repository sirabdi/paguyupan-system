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
import { type News } from "@/modules";
import { formatDate, stripHtml } from "@/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SEKERTARIS: "Sekertaris",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

// Kartu satu berita untuk listview admin (dipakai di layar kecil).
export function NewsAdminCard({
  news,
  canEdit,
  onEdit,
  onDelete,
}: {
  news: News;
  canEdit: boolean;
  onEdit: (news: News) => void;
  onDelete: (news: News) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium">{news.judul}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {stripHtml(news.konten)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{news.penulis.nama}</span>
          <Badge variant="secondary" className="text-xs">
            {ROLE_LABEL[news.penulis.role] ?? news.penulis.role}
          </Badge>
          <span>·</span>
          <span>{formatDate(news.createdAt)}</span>
        </div>
      </div>

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" />}
            aria-label={`Aksi untuk ${news.judul}`}
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(news)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(news)}
            >
              <Trash2Icon />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
