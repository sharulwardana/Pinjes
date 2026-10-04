export default function Loading() {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-10" role="status" aria-live="polite">
            <span className="sr-only">Memuat halaman...</span>
            <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="aspect-4/3 animate-pulse bg-slate-200" />
                        <div className="space-y-3 p-4">
                            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                            <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}