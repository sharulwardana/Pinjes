"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
        <AlertCircle className="size-7" aria-hidden />
      </span>
      <h1 className="text-title mt-4 text-ink">Halaman belum bisa dimuat</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
        Ada kendala saat memuat halaman ini. Coba lagi beberapa saat lagi, atau kembali ke beranda.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">Kode kendala: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-canvas transition hover:bg-ink/85 active:scale-95"
        >
          Coba lagi
        </button>
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