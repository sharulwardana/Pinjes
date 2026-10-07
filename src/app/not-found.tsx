import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Halaman tidak ditemukan | PinjeS" };

export default function NotFound() {
  return (
    <div className="shell flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-eyebrow text-brand">404 · Tidak ditemukan</p>
      <h1 className="text-title mt-3 text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        Alamat yang kamu buka tidak ada, atau barang yang kamu cari sudah tidak tersedia.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/search"
          className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-canvas transition hover:bg-ink/85 active:scale-95"
        >
          Cari barang
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full border border-line bg-surface px-6 text-sm font-semibold text-ink transition hover:border-ink hover:bg-canvas active:scale-95"
        >
          Ke beranda
        </Link>
      </div>
    </div>
  );
}