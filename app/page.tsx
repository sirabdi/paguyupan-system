import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/session";

export default async function Home() {
  const session = await requirePageSession();
  if (session.role === "SUPERADMIN") redirect("/superadmin");
  if (session.role === "ADMIN") redirect("/anggota");
  if (session.role === "SEKERTARIS") redirect("/news");
  redirect("/guest");
}
