"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 30_000;
const PUBLIC_PATHS = ["/login"];

function SessionWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const redirectingRef = React.useRef(false);

  const handleUnauthorized = React.useCallback(
    async (reason?: string) => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;

      if (reason === "kicked") {
        toast.error(
          "Sesi Anda diakhiri karena akun digunakan di perangkat atau tab lain.",
          { duration: 6000, id: "session-kicked" },
        );
        setTimeout(() => router.push("/login"), 1500);
      } else {
        router.push("/login");
      }
    },
    [router],
  );

  React.useEffect(() => {
    if (isPublic) return;

    // Instant: listen event dari fetchClient saat ada response 401
    async function on401() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status !== 401) return;
        const body = (await res.json().catch(() => null)) as { reason?: string } | null;
        handleUnauthorized(body?.reason);
      } catch {
        // Network error (server restart / offline) — abaikan
      }
    }

    window.addEventListener("auth:401", on401);

    // Polling sebagai fallback (tab idle tidak fetch apapun)
    async function pollSession() {
      if (redirectingRef.current) return;
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status !== 401) return;
        const body = (await res.json().catch(() => null)) as { reason?: string } | null;
        handleUnauthorized(body?.reason);
      } catch {
        // Network error (server restart / offline) — abaikan
      }
    }

    const interval = setInterval(pollSession, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("auth:401", on401);
      clearInterval(interval);
    };
  }, [isPublic, handleUnauthorized]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionWatcher />
      {children}
    </QueryClientProvider>
  );
}
