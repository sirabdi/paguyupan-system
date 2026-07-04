"use client";

import { Share2Icon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Membagikan tautan publik berita (/news/:id) via Web Share API,
// fallback salin ke clipboard.
export function ShareButton({
  title,
  newsId,
}: {
  title: string;
  newsId: number;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/news/${newsId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancel — abaikan
      }
      return;
    }

    // Fallback: salin ke clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link disalin ke clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
    >
      {copied ? (
        <CheckIcon className="size-3.5 text-green-600" />
      ) : (
        <Share2Icon className="size-3.5" />
      )}
      {copied ? "Tersalin" : "Bagikan"}
    </button>
  );
}
