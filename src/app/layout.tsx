import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { env } from "@/server/env";
import "./globals.css";

// Teks isi: Plus Jakarta Sans. Judul besar: Bricolage Grotesque.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f4ec",
};

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
    <html lang="id" className={`${jakarta.variable} ${bricolage.variable} h-full antialiased`}>
      {/* pb-24: ruang untuk bottom navigation di layar kecil */}
      <body className="flex min-h-dvh flex-col pb-24 md:pb-0">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-canvas focus:shadow-lg"
        >
          Lewati ke konten
        </a>
        <Providers>
          <Navbar />
          <div id="konten" className="flex flex-1 flex-col">
            {children}
          </div>
          <Footer />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
