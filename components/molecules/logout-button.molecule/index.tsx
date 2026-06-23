"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/atoms";
import { logout } from "@/modules";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOutIcon />
      Keluar
    </Button>
  );
}
