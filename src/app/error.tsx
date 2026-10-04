"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="container mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
            <TriangleAlert className="h-10 w-10 text-slate-400" aria-hidden />
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Halaman belum bisa dimuat</h1>
            <p className="mt-2 text-sm text-slate-600">
                Ada kendala saat memuat halaman ini. Coba lagi, dan kalau masih sama, kembali ke beranda.
            </p>
            {error.digest && <p className="mt-2 text-xs text-slate-400">Kode kendala: {error.digest}</p>}
            <div className="mt-6 flex gap-3">
                <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                    Coba lagi
                </button>
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