import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Halaman tidak ditemukan | PinjeS" };

export default function NotFound() {
    return (
        <div className="container mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
            <p className="text-sm font-semibold text-slate-500">404</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Halaman tidak ditemukan</h1>
            <p className="mt-2 text-sm text-slate-600">
                Alamat yang kamu buka tidak ada, atau barangnya sudah tidak tersedia.
            </p>
            <div className="mt-6 flex gap-3">
                <Link
                    href="/search"
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                    Cari barang
                </Link>
                <Link
                    href="/"
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                    Ke beranda
                </Link>
            </div>
        </div>
    );
}