"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InboxIcon, PlusIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
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
  Button,
  Input,
  Skeleton,
} from "@/components/atoms";

import { NEWS_KEY, deleteNews, fetchNewsPaginated, type News } from "@/modules";
import { NewsAdminCard } from "@/components/molecules";
import { useDebounced } from "@/utils";

type Props = { canEdit: boolean };

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <p className="text-sm">Gagal memuat berita.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCwIcon /> Coba lagi
      </Button>
    </div>
  );
}

function EmptyState({
  hasQuery,
  canEdit,
  onCreate,
}: {
  hasQuery: boolean;
  canEdit: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <InboxIcon className="size-10" />
      <p className="text-sm">
        {hasQuery ? "Tidak ada berita yang cocok." : "Belum ada berita."}
      </p>
      {canEdit && !hasQuery && (
        <Button variant="outline" size="sm" onClick={onCreate}>
          <PlusIcon /> Tambah berita pertama
        </Button>
      )}
    </div>
  );
}

export function NewsTable({ canEdit }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [q, setQ] = React.useState("");
  const debouncedQ = useDebounced(q, 250);
  const [deleteTarget, setDeleteTarget] = React.useState<News | null>(null);

  const {
    data,
    isPending,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...NEWS_KEY, debouncedQ],
    queryFn: ({ pageParam }) => fetchNewsPaginated({ q: debouncedQ, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
    placeholderData: (prev) => prev,
  });

  const allItems = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

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
    <>
      {/* Header: aksi + pencarian */}
      <div className="shrink-0 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">
            {isPending
              ? "Memuat data…"
              : `${total} berita${q ? " · terfilter" : ""}`}
          </p>
          {canEdit && (
            <Button size="sm" onClick={() => router.push("/news/create")}>
              <PlusIcon />
              Tambah
            </Button>
          )}
        </div>

        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul berita…"
            className="pl-8"
            aria-label="Cari judul berita"
          />
        </div>
      </div>

      {/* Listview */}
      <div
        className="flex-1 overflow-y-auto p-4 transition-opacity data-[fetching=true]:opacity-60"
        data-fetching={isFetching && !isPending && !isFetchingNextPage}
      >
        <div className="flex flex-col gap-2">
          {isPending ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-28" />
              </div>
            ))
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : allItems.length === 0 ? (
            <EmptyState
              hasQuery={Boolean(q)}
              canEdit={canEdit}
              onCreate={() => router.push("/news/create")}
            />
          ) : (
            <>
              {allItems.map((n) => (
                <NewsAdminCard
                  key={n.id}
                  news={n}
                  canEdit={canEdit}
                  onEdit={(x) => router.push(`/news/edit/${x.id}`)}
                  onDelete={setDeleteTarget}
                />
              ))}
              {hasNextPage && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Memuat…" : "Muat lebih banyak"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleting}
            >
              {deleting ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
