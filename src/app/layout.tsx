import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { env } from "@/server/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "PinjeS | Sewa barang dari toko rental di sekitarmu",
    template: "%s",
  },
  description:
    "Sewa kamera, drone, tenda, konsol game, dan perlengkapan lain dari toko rental lokal. Pilih tanggal, bayar langsung ke toko, lalu ambil barangnya.",
  openGraph: {
    title: "PinjeS",
    description: "Sewa barang dari toko rental di sekitarmu.",
    siteName: "PinjeS",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
        >
          Lewati ke konten
        </a>
        <Providers>
          <Navbar />
          <div id="konten" className="flex flex-1 flex-col">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}