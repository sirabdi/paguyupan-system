"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, LockIcon } from "lucide-react";
import { toast } from "sonner";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/atoms";
import { login } from "@/modules";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const mutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: (user) => {
      const dest = user.role === "ADMIN" ? "/anggota" : "/guest";
      router.push(dest);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  const loading = mutation.isPending;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10">
            <LockIcon className="size-5 text-primary" />
          </div>
          <CardTitle>Paguyupan System</CardTitle>
          <CardDescription>Masuk menggunakan email dan password</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2Icon className="animate-spin" />}
              {loading ? "Memverifikasi…" : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
