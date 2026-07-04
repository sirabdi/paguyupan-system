import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/molecules";
import { ROLE_LABEL } from "@/utils";

export async function Navbar() {
  const session = await getSession();
  const role = session?.role;

  const showAnggota = role === "ADMIN";
  const showIuran = role === "ADMIN" || role === "BENDAHARA";
  const showNews = Boolean(role);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/guest" className="font-semibold text-sm shrink-0 hover:opacity-75 transition-opacity">
          Paguyupan System
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {showAnggota && (
            <Link
              href="/anggota"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Anggota
            </Link>
          )}
          {showIuran && (
            <Link
              href="/iuran"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Iuran
            </Link>
          )}
          {showNews && (
            <Link
              href="/news"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Berita
            </Link>
          )}
        </nav>

        {session && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {ROLE_LABEL[session.role] ?? session.role}
            </span>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
