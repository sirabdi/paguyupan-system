import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/atoms";
import { Providers } from "./providers";

const quicksand = Quicksand({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paguyupan System",
  description: "Sistem manajemen anggota dan iuran paguyupan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.className} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
