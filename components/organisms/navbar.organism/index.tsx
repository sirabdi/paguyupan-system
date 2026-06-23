import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/molecules";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-semibold text-sm">Paguyupan System</span>
        {session && (
          <div className="flex items-center gap-3">
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
