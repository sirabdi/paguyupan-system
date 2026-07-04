"use client";

import * as React from "react";
import {
  ChevronLeft,
  ClockIcon,
  HeartIcon,
  MessageCircleIcon,
  NewspaperIcon,
  SendIcon,
  Trash2Icon,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type News,
  NEWS_KEY,
  fetchKomentar,
  postKomentar,
  deleteKomentar,
  toggleLike,
  komentarKey,
  type Komentar,
} from "@/modules";
import { formatDate, stripHtml, ROLE_LABEL } from "@/utils";

// ─── Shared like mutation ─────────────────────────────────────────────────────

function useLikeMutation(newsId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => toggleLike(newsId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NEWS_KEY });
      const prev = queryClient.getQueryData<News[]>(NEWS_KEY);
      queryClient.setQueryData<News[]>(NEWS_KEY, (old) =>
        old?.map((n) =>
          n.id === newsId
            ? {
                ...n,
                liked: !n.liked,
                _count: { ...n._count, like: n._count.like + (n.liked ? -1 : 1) },
              }
            : n,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(NEWS_KEY, ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: NEWS_KEY }),
  });
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export function FeaturedCard({
  news,
  myAnggotaId,
}: {
  news: News;
  myAnggotaId: number;
}) {
  const [open, setOpen] = React.useState(false);
  const likeMutation = useLikeMutation(news.id);

  return (
    <>
      <div className="w-full overflow-hidden rounded-sm bg-white text-left shadow-sm ring-1 ring-zinc-100">
        <button onClick={() => setOpen(true)} className="w-full text-left">
          {news.bannerUrl ? (
            <img src={news.bannerUrl} alt={news.judul} className="h-40 w-full object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
              <NewspaperIcon className="size-10 text-blue-300" />
            </div>
          )}
          <div className="p-4 flex flex-col gap-1">
            <span className="mb-1.5 w-fit inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold capitalize tracking-wide text-green-600">
              Paling Baru
            </span>
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900">{news.judul}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ClockIcon className="size-3" />
              <span>{formatDate(news.createdAt)}</span>
              <span>·</span>
              <span>{news.penulis.nama}</span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-4 border-t border-zinc-50 px-4 py-2.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
          >
            <HeartIcon className={`size-3.5 transition-colors ${news.liked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{news._count.like}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-500 transition-colors"
          >
            <MessageCircleIcon className="size-3.5" />
            <span>{news._count.komentar}</span>
          </button>
        </div>
      </div>
      {open && (
        <NewsDetailSheet news={news} myAnggotaId={myAnggotaId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

export function SmallCard({
  news,
  myAnggotaId,
}: {
  news: News;
  myAnggotaId: number;
}) {
  const [open, setOpen] = React.useState(false);
  const likeMutation = useLikeMutation(news.id);

  return (
    <>
      <div className="w-full overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-100">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full gap-3 text-left transition-colors hover:bg-zinc-50"
        >
          {news.bannerUrl ? (
            <img src={news.bannerUrl} alt={news.judul} className="size-24 shrink-0 rounded-l-sm object-cover" />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center bg-linear-to-br from-blue-100 to-indigo-100">
              <NewspaperIcon className="size-6 text-blue-300" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-3 pr-3">
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-900">{news.judul}</h3>
            <p className="line-clamp-1 text-[11px] text-zinc-400">{stripHtml(news.konten)}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span>{news.penulis.nama}</span>
              <span>·</span>
              <span>{formatDate(news.createdAt)}</span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-4 border-t border-zinc-50 px-3 py-2">
          <button
            type="button"
            onClick={() => likeMutation.mutate()}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
          >
            <HeartIcon className={`size-3.5 ${news.liked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{news._count.like}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-500 transition-colors"
          >
            <MessageCircleIcon className="size-3.5" />
            <span>{news._count.komentar}</span>
          </button>
        </div>
      </div>
      {open && (
        <NewsDetailSheet news={news} myAnggotaId={myAnggotaId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function NewsDetailSheet({
  news,
  myAnggotaId,
  onClose,
}: {
  news: News;
  myAnggotaId: number;
  onClose: () => void;
}) {
  const [commentOpen, setCommentOpen] = React.useState(false);
  const likeMutation = useLikeMutation(news.id);

  return (
    <div className="fixed inset-y-0 left-1/2 z-50 flex w-full -translate-x-1/2 flex-col bg-white md:w-97.5 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <button
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="truncate text-sm font-semibold text-zinc-800">{news.judul}</span>
      </div>

      {/* Scrollable article */}
      <div className="flex-1 overflow-y-auto">
        {news.bannerUrl && (
          <img src={news.bannerUrl} alt={news.judul} className="h-48 w-full object-cover" />
        )}
        <div className="px-5 py-4">
          <h2 className="text-lg font-bold leading-snug text-zinc-900">{news.judul}</h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
            <ClockIcon className="size-3" />
            <span>{formatDate(news.createdAt)}</span>
            <span>·</span>
            <span>{news.penulis.nama}</span>
            <span>·</span>
            <span className="text-blue-500">{ROLE_LABEL[news.penulis.role] ?? news.penulis.role}</span>
          </div>
          <div
            className="mt-4 text-sm leading-relaxed text-zinc-700 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-300 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_img]:mt-3 [&_img]:rounded-sm"
            dangerouslySetInnerHTML={{ __html: news.konten }}
          />
        </div>
      </div>

      {/* Action bar: like + comment */}
      <div className="shrink-0 flex items-center gap-5 border-t border-zinc-100 px-5 py-3">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-500 transition-colors"
        >
          <HeartIcon className={`size-5 transition-colors ${news.liked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{news._count.like}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentOpen(true)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-blue-500 transition-colors"
        >
          <MessageCircleIcon className="size-5" />
          <span>{news._count.komentar} komentar</span>
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
  onClose,
}: {
  open: boolean;
  newsId: number;
  myAnggotaId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const key = komentarKey(newsId);

  const { data: komentar = [], isPending } = useQuery({
    queryKey: key,
    queryFn: () => fetchKomentar(newsId),
    enabled: open,
  });

  const [input, setInput] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<{ id: number; nama: string } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const postMutation = useMutation({
    mutationFn: (vars: { konten: string; parentId?: number }) =>
      postKomentar(newsId, vars.konten, vars.parentId),
    onSuccess: () => {
      setInput("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteKomentar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });

  function handleReply(id: number, nama: string) {
    setReplyTo({ id, nama });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    postMutation.mutate({ konten: trimmed, parentId: replyTo?.id });
  }

  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex h-[85%] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Drag handle */}
      <div className="flex shrink-0 justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-zinc-300" />
      </div>

      {/* Title + close */}
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

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isPending ? (
          <p className="text-xs text-zinc-400">Memuat komentar…</p>
        ) : komentar.length === 0 ? (
          <p className="text-xs text-zinc-400">Belum ada komentar. Jadilah yang pertama!</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {komentar.map((k) => (
              <KomentarItem
                key={k.id}
                komentar={k}
                myAnggotaId={myAnggotaId}
                onReply={() => handleReply(k.id, k.penulis.nama)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Pinned input */}
      <div className="shrink-0 border-t border-zinc-100 bg-white">
        {replyTo && (
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2">
            <span className="text-xs text-blue-600">
              Membalas <strong>{replyTo.nama}</strong>
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
            placeholder={replyTo ? `Balas ${replyTo.nama}…` : "Tulis komentar…"}
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
  komentar,
  myAnggotaId,
  onReply,
  onDelete,
}: {
  komentar: Komentar;
  myAnggotaId: number;
  onReply: () => void;
  onDelete: (id: number) => void;
}) {
  const canDelete = komentar.penulis.id === myAnggotaId;

  return (
    <li>
      <div className="flex gap-2.5">
        <Avatar nama={komentar.penulis.nama} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-zinc-800">{komentar.penulis.nama}</span>
            <span className="text-[10px] text-zinc-400">{formatDate(komentar.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-700 leading-relaxed">{komentar.konten}</p>
          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={onReply}
              className="text-[10px] font-medium text-zinc-400 hover:text-blue-500 transition-colors"
            >
              Balas
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(komentar.id)}
                className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2Icon className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {komentar.replies.length > 0 && (
        <ul className="ml-9 mt-2 flex flex-col gap-3 border-l-2 border-zinc-100 pl-3">
          {komentar.replies.map((r) => (
            <li key={r.id} className="flex gap-2.5">
              <Avatar nama={r.penulis.nama} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-zinc-800">{r.penulis.nama}</span>
                  <span className="text-[10px] text-zinc-400">{formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-700 leading-relaxed">{r.konten}</p>
                {r.penulis.id === myAnggotaId && (
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="mt-1 text-[10px] text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2Icon className="size-3" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
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
    <div className={`${cls} shrink-0 flex items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600`}>
      {initials}
    </div>
  );
}
