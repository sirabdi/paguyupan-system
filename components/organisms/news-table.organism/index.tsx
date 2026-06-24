"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EllipsisIcon,
  InboxIcon,
  NewspaperIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
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
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms";

import { NEWS_KEY, deleteNews, fetchNews, type News } from "@/modules";
import { formatDate, stripHtml } from "@/utils";

type Props = { canEdit: boolean };

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SEKERTARIS: "Sekertaris",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function NewsTable({ canEdit }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [q, setQ] = React.useState("");
  const debouncedQ = useDebounced(q, 250);
  const [deleteTarget, setDeleteTarget] = React.useState<News | null>(null);

  const {
    data = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [...NEWS_KEY, debouncedQ],
    queryFn: () => fetchNews(debouncedQ),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (target: News) => deleteNews(target.id),
    onSuccess: (_v, target) => {
      toast.success(`Berita "${target.judul}" dihapus`);
      queryClient.invalidateQueries({ queryKey: NEWS_KEY });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleting = deleteMutation.isPending;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <NewspaperIcon className="size-4" />
          Berita
        </CardTitle>
        <CardDescription>
          {isPending
            ? "Memuat data…"
            : `${data.length} berita${q ? " (terfilter)" : ""}`}
        </CardDescription>
        {canEdit && (
          <CardAction>
            <Button onClick={() => router.push("/news/create")}>
              <PlusIcon />
              Tambah Berita
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Pencarian */}
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul berita…"
            className="pl-8"
          />
        </div>

        {/* Tabel */}
        <div
          className="rounded-lg border transition-opacity data-[fetching=true]:opacity-60"
          data-fetching={isFetching && !isPending}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead className="hidden md:table-cell">
                  Ringkasan
                </TableHead>
                <TableHead>Penulis</TableHead>
                <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                {canEdit && (
                  <TableHead className="w-24 text-center">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canEdit ? 5 : 4 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4}>
                    <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                      <p>Gagal memuat berita.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                      >
                        <RefreshCwIcon /> Coba lagi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4}>
                    <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                      <InboxIcon className="size-8" />
                      <p>
                        {q
                          ? "Tidak ada berita yang cocok."
                          : "Belum ada berita."}
                      </p>
                      {canEdit && !q && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/news/create")}
                        >
                          <PlusIcon /> Tambah berita pertama
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {n.judul}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-sm text-muted-foreground whitespace-normal">
                      <span className="line-clamp-1">
                        {stripHtml(n.konten)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">{n.penulis.nama}</span>
                        <Badge variant="secondary" className="w-fit text-xs">
                          {ROLE_LABEL[n.penulis.role] ?? n.penulis.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="w-24 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" />}
                            aria-label={`Aksi untuk ${n.judul}`}
                          >
                            <EllipsisIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/news/edit/${n.id}`)}
                            >
                              <PencilIcon /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(n)}
                            >
                              <Trash2Icon /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Konfirmasi hapus */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus berita?</AlertDialogTitle>
            <AlertDialogDescription>
              Berita{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteTarget?.judul}&rdquo;
              </span>{" "}
              akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget)
              }
              disabled={deleting}
            >
              {deleting ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
