import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="shell pb-16 pt-4 md:pt-8" role="status" aria-live="polite">
      <span className="sr-only">Memuat hasil pencarian...</span>
      <header className="mb-6 space-y-2 md:mb-8">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-full" />
      </header>

      {/* Pill placeholder */}
      <div className="mb-8 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block space-y-4">
          <Skeleton className="h-72 w-full rounded-4xl" />
        </aside>

        <main className="space-y-6">
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,16.5rem),1fr))] md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[1.75rem] border border-line bg-surface p-2 shadow-xs">
                <Skeleton className="aspect-4/5 w-full rounded-[1.4rem]" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                  <Skeleton className="h-5 w-1/3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
