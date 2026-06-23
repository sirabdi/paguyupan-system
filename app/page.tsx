import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/anggota");
  if (session.role === "SEKERTARIS") redirect("/news");
  redirect("/guest");
}
