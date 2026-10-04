import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { db } from "@/server/db";
import { searchProducts } from "@/server/services/products";
import type { SearchInput } from "@/features/products/schemas";
import { isDateKey, todayKey } from "@/lib/dates";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Cari Barang | PinjeS" };

const SORTS = [
  { value: "popular", label: "Terpopuler" },
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
  { value: "rating", label: "Rating tertinggi" },
] as const;

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function buildHref(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (v) sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `/search?${s}` : "/search";
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const q = first(p.q)?.trim() || undefined;
  const activeCategory = categories.find((c) => c.slug === first(p.category));
  const sort = SORTS.find((s) => s.value === first(p.sort))?.value ?? "popular";
  const page = Math.max(1, toInt(first(p.page)) ?? 1);

  let minPrice = toInt(first(p.minPrice));
  let maxPrice = toInt(first(p.maxPrice));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const rawStart = first(p.startDate);
  const rawEnd = first(p.endDate);
  const datesValid = Boolean(rawStart && rawEnd && isDateKey(rawStart) && isDateKey(rawEnd) && rawStart <= rawEnd);
  const startDate = datesValid ? rawStart : undefined;
  const endDate = datesValid ? rawEnd : undefined;

  const result = await searchProducts({
    q,
    category: activeCategory?.slug,
    sort,
    page,
    minPrice,
    maxPrice,
    startDate,
    endDate,
  } as SearchInput);

  const current: Record<string, string | undefined> = {
    q,
    category: activeCategory?.slug,
    sort: sort !== "popular" ? sort : undefined,
    minPrice: minPrice?.toString(),
    maxPrice: maxPrice?.toString(),
    startDate,
    endDate,
  };
  const link = (overrides: Record<string, string | undefined>) => buildHref(current, overrides);

  const hasFilters = Boolean(
    q || activeCategory || minPrice !== undefined || maxPrice !== undefined || startDate,
  );
  const title = q ? `Hasil untuk "${q}"` : activeCategory ? activeCategory.name : "Semua barang";

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:flex-row">
      {/* Filter */}
      <aside className="w-full shrink-0 space-y-8 md:w-64">
        <form action="/search" method="get" className="space-y-5">
          {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
          {current.sort && <input type="hidden" name="sort" value={current.sort} />}

          <div className="space-y-1.5">
            <label htmlFor="q" className="text-sm font-semibold text-slate-900">
              Kata kunci
            </label>
            <input id="q" name="q" defaultValue={q ?? ""} placeholder="Contoh: kamera" className={inputClass} />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold text-slate-900">Harga per hari (Rp)</legend>
            <div className="flex items-center gap-2">
              <input
                name="minPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={minPrice ?? ""}
                placeholder="Min"
                aria-label="Harga minimum"
                className={inputClass}
              />
              <span className="text-slate-400">-</span>
              <input
                name="maxPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={maxPrice ?? ""}
                placeholder="Maks"
                aria-label="Harga maksimum"
                className={inputClass}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold text-slate-900">Tanggal sewa</legend>
            <input
              name="startDate"
              type="date"
              min={todayKey()}
              defaultValue={startDate ?? ""}
              aria-label="Tanggal mulai"
              className={inputClass}
            />
            <input
              name="endDate"
              type="date"
              min={todayKey()}
              defaultValue={endDate ?? ""}
              aria-label="Tanggal selesai"
              className={inputClass}
            />
            <p className="text-xs text-slate-500">Isi kedua tanggal untuk hanya melihat barang yang tersedia.</p>
          </fieldset>

          <Button type="submit" className="w-full">
            Terapkan
          </Button>
        </form>

        {categories.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Kategori</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href={link({ category: undefined, page: undefined })}
                  className={`text-sm ${!activeCategory ? "font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Semua kategori
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={link({ category: c.slug, page: undefined })}
                    className={`text-sm ${activeCategory?.id === c.id ? "font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Hasil */}
      <main className="min-w-0 flex-1">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{result.total} barang</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">Urutkan:</span>
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={link({ sort: s.value === "popular" ? undefined : s.value, page: undefined })}
                aria-current={sort === s.value ? "true" : undefined}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${sort === s.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {s.label}
              </Link>
            ))}
            {hasFilters && (
              <Link href="/search" className="ml-auto text-sm font-medium text-slate-700 underline">
                Hapus semua filter
              </Link>
            )}
          </div>
        </div>

        {result.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-20 text-center">
            <SearchX className="mb-3 h-8 w-8 text-slate-400" aria-hidden />
            <p className="text-lg font-semibold text-slate-900">Barang belum ditemukan</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Coba kata kunci yang lebih umum, ubah rentang harga atau tanggal, atau hapus filter.
            </p>
            {hasFilters && (
              <Link
                href="/search"
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Hapus semua filter
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {result.totalPages > 1 && (
              <nav aria-label="Halaman hasil" className="mt-8 flex items-center justify-center gap-4 text-sm">
                {page > 1 ? (
                  <Link
                    href={link({ page: String(page - 1) })}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Sebelumnya
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-slate-600">
                  Halaman {page} dari {result.totalPages}
                </span>
                {page < result.totalPages ? (
                  <Link
                    href={link({ page: String(page + 1) })}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}