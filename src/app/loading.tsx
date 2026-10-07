import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="shell py-8" role="status" aria-live="polite">
            <span className="sr-only">Memuat halaman...</span>
            <Skeleton className="h-10 w-64 rounded-full" />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-3xl border border-line bg-surface p-2 shadow-xs">
                        <Skeleton className="aspect-4/5 w-full rounded-2xl" />
                        <div className="space-y-3 p-4">
                            <Skeleton className="h-4 w-3/4 rounded-full" />
                            <Skeleton className="h-3 w-1/2 rounded-full" />
                            <Skeleton className="h-6 w-1/3 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}