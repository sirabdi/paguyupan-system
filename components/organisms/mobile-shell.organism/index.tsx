import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

// Frame "aplikasi mobile" yang dipakai semua page: kolom terpusat (390px di
// desktop, full-width di HP) dengan header opsional + area konten scrollable.
export function MobileShell({
  title,
  backHref,
  children,
}: {
  title?: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-zinc-100">
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-zinc-50 md:w-97.5">
        {title && (
          <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 bg-white px-4 py-3">
            {backHref && (
              <Link
                href={backHref}
                aria-label="Kembali"
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200"
              >
                <ArrowLeftIcon className="size-4" />
              </Link>
            )}
            <span className="text-base font-bold text-zinc-900">{title}</span>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
