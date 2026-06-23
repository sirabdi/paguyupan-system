import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserRoundIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms";
import { LogoutButton } from "@/components/molecules";

export const metadata: Metadata = {
  title: "Beranda — Paguyupan",
};

const ROLE_LABEL: Record<string, string> = {
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
};

export default async function GuestPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Admin tidak boleh di sini
  if (session.role === "ADMIN") redirect("/anggota");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-semibold text-sm">Paguyupan System</span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
              <UserRoundIcon className="size-6 text-muted-foreground" />
            </div>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>
              Anda masuk sebagai{" "}
              <span className="font-medium text-foreground">
                {ROLE_LABEL[session.role] ?? session.role}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Anda memiliki akses baca saja. Hubungi Admin untuk mengubah data.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
