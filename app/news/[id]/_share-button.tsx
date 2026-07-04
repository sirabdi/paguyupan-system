"use client";

import { Share2Icon, CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ShareButton({ title, newsId }: { title: string; newsId: number }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/news/${newsId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancel — ignore
      }
      return;
    }

    // Fallback: copy to clipboard
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
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
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
