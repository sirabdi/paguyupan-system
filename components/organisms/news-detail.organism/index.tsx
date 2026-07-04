"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  ClockIcon,
  HeartIcon,
  MessageCircleIcon,
  NewspaperIcon,
  SendIcon,
  Trash2Icon,
  X,
} from "lucide-react";

import {
  type News,
  NEWS_KEY,
  fetchNewsById,
  type Komentar,
  komentarKey,
  fetchKomentar,
  postKomentar,
  deleteKomentar,
  toggleLike,
} from "@/modules";
import { formatDate, ROLE_LABEL } from "@/utils";
import { KategoriTag, ShareButton } from "@/components/molecules";

const detailKey = (id: number) => [...NEWS_KEY, "detail", id] as const;

function DetailHeader({
  onBack,
  title,
  newsId,
}: {
  onBack: () => void;
  title?: string;
  newsId?: number;
}) {
  return (
    <div className="shrink-0 flex items-center gap-2 border-b border-zinc-100 px-3 py-3">
      <button
        onClick={onBack}
        aria-label="Kembali"
        className="flex size-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
      >
        <ChevronLeft size={20} />
      </button>
      {title && (
        <p className="flex-1 truncate text-sm font-semibold text-zinc-800">
          {title}
        </p>
      )}
      {newsId !== undefined && title && (
        <ShareButton title={title} newsId={newsId} />
      )}
    </div>
  );
}

// ─── Detail view (halaman) ─────────────────────────────────────────────────────

export function NewsDetailView({
  newsId,
  myAnggotaId,
  openComments = false,
  pendingKomentarId = null,
}: {
  newsId: number;
  myAnggotaId: number;
  openComments?: boolean;
  pendingKomentarId?: number | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [commentOpen, setCommentOpen] = React.useState(openComments);

  const {
    data: news,
    isPending,
    isError,
  } = useQuery({
    queryKey: detailKey(newsId),
    queryFn: () => fetchNewsById(newsId),
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(newsId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: detailKey(newsId) });
      const prev = queryClient.getQueryData<News>(detailKey(newsId));
      queryClient.setQueryData<News>(detailKey(newsId), (old) =>
        old
          ? {
              ...old,
              liked: !old.liked,
              _count: {
                ...old._count,
                like: old._count.like + (old.liked ? -1 : 1),
              },
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      queryClient.setQueryData(detailKey(newsId), ctx?.prev),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey(newsId) });
      queryClient.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/guest");
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <DetailHeader onBack={goBack} />
        <div className="flex-1 overflow-y-auto">
          <div className="h-52 w-full animate-pulse bg-zinc-200" />
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-200" />
            <div className="h-40 w-full animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !news) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <DetailHeader onBack={goBack} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-zinc-400">
          <NewspaperIcon className="size-10" />
          <p className="text-sm">Berita tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <DetailHeader onBack={goBack} title={news.judul} newsId={news.id} />

      {/* Konten */}
      <div className="flex-1 overflow-y-auto">
        {news.bannerUrl ? (
          <img
            src={news.bannerUrl}
            alt={news.judul}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 items-center justify-center bg-linear-to-br from-blue-100 to-indigo-100">
            <NewspaperIcon className="size-12 text-blue-300" />
          </div>
        )}

        <div className="px-5 py-4">
          <div className="mb-2">
            <KategoriTag kategori={news.kategori} />
          </div>
          <h1 className="text-lg font-bold leading-snug text-zinc-900">
            {news.judul}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-400">
            <ClockIcon className="size-3" />
            <span>{formatDate(news.createdAt)}</span>
            <span>·</span>
            <span>{news.penulis.nama}</span>
            <span>·</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
              {ROLE_LABEL[news.penulis.role] ?? news.penulis.role}
            </span>
          </div>
          <div className="mt-4 border-t border-zinc-100" />
          <div
            className="mt-4 text-sm leading-relaxed text-zinc-700 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-300 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_img]:mt-3 [&_img]:rounded-sm"
            dangerouslySetInnerHTML={{ __html: news.konten }}
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="shrink-0 flex items-center gap-5 border-t border-zinc-100 bg-white px-5 py-3">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-500 transition-colors"
        >
          <HeartIcon
            className={`size-5 transition-colors ${news.liked ? "fill-red-500 text-red-500" : ""}`}
          />
          <span>{news._count.like} Like</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentOpen(true)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-blue-500 transition-colors"
        >
          <MessageCircleIcon className="size-5" />
          <span>{news._count.komentar} Komentar</span>
        </button>
      </div>

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${commentOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setCommentOpen(false)}
      />

      {/* Comment bottom sheet */}
      <CommentBottomSheet
        open={commentOpen}
        newsId={news.id}
        myAnggotaId={myAnggotaId}
        pendingKomentarId={pendingKomentarId}
        onClose={() => setCommentOpen(false)}
      />
    </div>
  );
}

// ─── Comment bottom sheet ─────────────────────────────────────────────────────

function CommentBottomSheet({
  open,
  newsId,
  myAnggotaId,
  pendingKomentarId = null,
  onClose,
}: {
  open: boolean;
  newsId: number;
  myAnggotaId: number;
  pendingKomentarId?: number | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const key = komentarKey(newsId);

  const { data: komentarList = [], isPending } = useQuery({
    queryKey: key,
    queryFn: () => fetchKomentar(newsId),
    enabled: open,
  });

  // Komentar akar yang perlu di-expand otomatis saat deep-link ke sebuah balasan.
  const autoExpandKomentarId = React.useMemo(() => {
    if (!pendingKomentarId || komentarList.length === 0) return null;
    const root = komentarList.find(
      (k) =>
        k.id === pendingKomentarId ||
        k.replies.some((r) => r.id === pendingKomentarId),
    );
    return root?.id ?? null;
  }, [pendingKomentarId, komentarList]);

  const [input, setInput] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<{
    parentId: number;
    targetId: number;
    targetNama: string;
  } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function invalidateCounts() {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: NEWS_KEY });
    queryClient.invalidateQueries({ queryKey: detailKey(newsId) });
  }

  const postMutation = useMutation({
    mutationFn: (vars: {
      konten: string;
      parentId?: number;
      targetId?: number;
    }) => postKomentar(newsId, vars.konten, vars.parentId, vars.targetId),
    onSuccess: () => {
      setInput("");
      setReplyTo(null);
      invalidateCounts();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteKomentar(id),
    onSuccess: invalidateCounts,
  });

  function handleReply(parentId: number, targetId: number, targetNama: string) {
    setReplyTo({ parentId, targetId, targetNama });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const konten = replyTo ? `@[${replyTo.targetNama}] ${trimmed}` : trimmed;
    postMutation.mutate({
      konten,
      parentId: replyTo?.parentId,
      targetId: replyTo?.targetId,
    });
  }

  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex h-[85%] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex shrink-0 justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-zinc-300" />
      </div>
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-3">
        <p className="text-sm font-semibold text-zinc-800">Komentar</p>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isPending ? (
          <p className="text-xs text-zinc-400">Memuat komentar…</p>
        ) : komentarList.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Belum ada komentar. Jadilah yang pertama!
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {komentarList.map((k) => (
              <KomentarItem
                key={k.id}
                item={k}
                myAnggotaId={myAnggotaId}
                onReply={handleReply}
                onDelete={(id) => deleteMutation.mutate(id)}
                autoExpandReplies={k.id === autoExpandKomentarId}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-100 bg-white">
        {replyTo && (
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2">
            <span className="text-xs text-blue-600">
              Membalas <strong>{replyTo.targetNama}</strong>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-xs text-blue-400 hover:text-blue-600"
            >
              Batal
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={replyTo ? `Balas ${replyTo.targetNama}…` : "Tulis komentar…"}
            className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-blue-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || postMutation.isPending}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
          >
            <SendIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KomentarItem ─────────────────────────────────────────────────────────────

function KomentarItem({
  item,
  myAnggotaId,
  onReply,
  onDelete,
  autoExpandReplies = false,
}: {
  item: Komentar;
  myAnggotaId: number;
  onReply: (parentId: number, targetId: number, targetNama: string) => void;
  onDelete: (id: number) => void;
  autoExpandReplies?: boolean;
}) {
  const canDelete = item.penulis.id === myAnggotaId;
  const [showReplies, setShowReplies] = React.useState(autoExpandReplies);

  return (
    <li>
      <div className="flex gap-2.5">
        <Avatar nama={item.penulis.nama} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-zinc-800">
              {item.penulis.nama}
            </span>
            <span className="text-[10px] text-zinc-400">
              {formatDate(item.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-700 leading-relaxed">
            {item.konten}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onReply(item.id, item.penulis.id, item.penulis.nama)}
              className="text-[10px] font-medium text-zinc-400 hover:text-blue-500 transition-colors"
            >
              Balas
            </button>
            {item.replies.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReplies((v) => !v)}
                className="flex items-center gap-0.5 text-[10px] font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                <ChevronDown
                  className={`size-3 transition-transform duration-200 ${showReplies ? "rotate-180" : ""}`}
                />
                {showReplies
                  ? "Sembunyikan balasan"
                  : `Lihat ${item.replies.length} balasan`}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2Icon className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplies && item.replies.length > 0 && (
        <ul className="ml-9 mt-2 flex flex-col gap-3 border-l-2 border-zinc-100 pl-3">
          {item.replies.map((r) => (
            <li key={r.id} className="flex gap-2.5">
              <Avatar nama={r.penulis.nama} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-zinc-800">
                    {r.penulis.nama}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <ReplyContent konten={r.konten} />
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onReply(item.id, r.penulis.id, r.penulis.nama)}
                    className="text-[10px] font-medium text-zinc-400 hover:text-blue-500 transition-colors"
                  >
                    Balas
                  </button>
                  {r.penulis.id === myAnggotaId && (
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2Icon className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── ReplyContent ─────────────────────────────────────────────────────────────

function ReplyContent({ konten }: { konten: string }) {
  const match = konten.match(/^@\[(.+?)\] ([\s\S]+)$/);
  if (!match)
    return (
      <p className="mt-0.5 text-xs text-zinc-700 leading-relaxed">{konten}</p>
    );
  return (
    <p className="mt-0.5 text-xs text-zinc-700 leading-relaxed">
      <span className="font-semibold text-blue-500">@{match[1]}</span>{" "}
      {match[2]}
    </p>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ nama, size = "md" }: { nama: string; size?: "md" | "sm" }) {
  const initials = nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const cls = size === "sm" ? "size-6 text-[9px]" : "size-7 text-[10px]";
  return (
    <div
      className={`${cls} shrink-0 flex items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600`}
    >
      {initials}
    </div>
  );
}
