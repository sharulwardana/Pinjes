import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, SearchX, X } from "lucide-react";
import { db } from "@/server/db";
import { searchProducts } from "@/server/services/products";
import type { SearchInput } from "@/features/products/schemas";
import { isDateKey, todayKey } from "@/lib/dates";
import { formatDateRange, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";
import { FilterDrawer } from "@/components/filter-drawer";
import { Button } from "@/components/ui/button";
import { CategoryPills } from "@/components/category-pills";

export const metadata: Metadata = { title: "Jelajahi Barang | PinjeS" };

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

const fieldClass =
  "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-ink placeholder:text-muted/70 transition focus:border-ink focus:outline-none focus:ring-4 focus:ring-signal/50";

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

  // Filter aktif ditampilkan sebagai chip yang bisa dihapus satu per satu.
  const activeFilters: { key: string; label: string; href: string }[] = [];
  if (q) activeFilters.push({ key: "q", label: `"${q}"`, href: link({ q: undefined }) });
  if (activeCategory) {
    activeFilters.push({ key: "category", label: activeCategory.name, href: link({ category: undefined }) });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const label =
      minPrice !== undefined && maxPrice !== undefined
        ? `${formatRupiah(minPrice)} – ${formatRupiah(maxPrice)}`
        : minPrice !== undefined
          ? `Mulai ${formatRupiah(minPrice)}`
          : `Sampai ${formatRupiah(maxPrice!)}`;
    activeFilters.push({ key: "price", label, href: link({ minPrice: undefined, maxPrice: undefined }) });
  }
  if (startDate && endDate) {
    activeFilters.push({
      key: "dates",
      label: formatDateRange(startDate, endDate, { short: true }),
      href: link({ startDate: undefined, endDate: undefined }),
    });
  }

  const title = q ? `Hasil untuk "${q}"` : activeCategory ? activeCategory.name : "Semua barang";

  return (
    <div className="shell pb-8 pt-4 md:pt-8">
      <header className="mb-6 md:mb-8">
        <p className="text-eyebrow text-brand">Jelajahi</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="text-title max-w-4xl text-ink">{title}</h1>
          <p className="pb-1 text-sm text-muted">{result.total} barang</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 2xl:grid-cols-[20rem_minmax(0,1fr)] 2xl:gap-14">
        {/* Filter: laci di HP/tablet, sidebar menempel di laptop */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <FilterDrawer activeCount={activeFilters.filter((f) => f.key !== "category").length}>
            <form action="/search" method="get" className="space-y-6">
              {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
              {current.sort && <input type="hidden" name="sort" value={current.sort} />}

              <div className="space-y-2">
                <label htmlFor="q" className="text-sm font-semibold text-ink">
                  Kata kunci
                </label>
                <input id="q" name="q" defaultValue={q ?? ""} placeholder="Contoh: kamera" className={fieldClass} />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-ink">Harga per hari (Rp)</legend>
                <div className="flex items-center gap-2">
                  <input
                    name="minPrice"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={minPrice ?? ""}
                    placeholder="Min"
                    aria-label="Harga minimum"
                    className={fieldClass}
                  />
                  <span className="text-muted" aria-hidden>
                    –
                  </span>
                  <input
                    name="maxPrice"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={maxPrice ?? ""}
                    placeholder="Maks"
                    aria-label="Harga maksimum"
                    className={fieldClass}
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-ink">Tanggal sewa</legend>
                <input
                  name="startDate"
                  type="date"
                  min={todayKey()}
                  defaultValue={startDate ?? ""}
                  aria-label="Tanggal mulai"
                  className={fieldClass}
                />
                <input
                  name="endDate"
                  type="date"
                  min={todayKey()}
                  defaultValue={endDate ?? ""}
                  aria-label="Tanggal selesai"
                  className={fieldClass}
                />
                <p className="text-xs leading-relaxed text-muted">
                  Isi kedua tanggal untuk hanya melihat barang yang tersedia.
                </p>
              </fieldset>

              <Button type="submit" size="lg" className="w-full">
                Terapkan filter
              </Button>
            </form>
          </FilterDrawer>
        </aside>

        {/* Hasil */}
        <main className="min-w-0">
          <div className="space-y-4">
            {/* Kategori: chip dengan layout animation sliding indicator */}
            {categories.length > 0 && (
              <CategoryPills
                activeSlug={activeCategory?.slug}
                items={[
                  { id: "all", name: "Semua", href: link({ category: undefined, page: undefined }) },
                  ...categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    href: link({ category: c.slug, page: undefined }),
                  })),
                ]}
              />
            )}

            {/* Urutan */}
            <nav
              aria-label="Urutkan"
              className="hide-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
            >
              <span className="shrink-0 pr-1 text-sm text-muted">Urutkan</span>
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={link({ sort: s.value === "popular" ? undefined : s.value, page: undefined })}
                  aria-current={sort === s.value ? "true" : undefined}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition duration-300",
                    sort === s.value ? "bg-brand-soft text-brand" : "text-muted hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </nav>

            {/* Filter aktif */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label="Filter aktif">
                {activeFilters.map((f) => (
                  <Link
                    key={f.key}
                    href={f.href}
                    aria-label={`Hapus filter ${f.label}`}
                    className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-signal pl-4 pr-3 text-sm font-semibold text-ink transition active:scale-95"
                  >
                    {f.label}
                    <X className="size-3.5 transition-transform duration-300 group-hover:rotate-90" aria-hidden />
                  </Link>
                ))}
                {activeFilters.length > 1 && (
                  <Link href="/search" className="px-2 text-sm font-medium text-muted underline underline-offset-4 hover:text-ink">
                    Hapus semua
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-8">
            {result.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-line bg-surface/60 px-5 py-20 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
                  <SearchX className="size-7" aria-hidden />
                </span>
                <p className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">Barang belum ditemukan</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                  Coba kata kunci yang lebih umum, ubah rentang harga atau tanggal, atau hapus filter.
                </p>
                {activeFilters.length > 0 && (
                  <Link
                    href="/search"
                    className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-canvas transition hover:bg-ink/85 active:scale-95"
                  >
                    Hapus semua filter
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,16.5rem),1fr))] md:gap-6">
                  {result.items.map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i < 2} />
                  ))}
                </div>

                {result.totalPages > 1 && (
                  <nav aria-label="Halaman hasil" className="mt-10 flex items-center justify-between gap-3 text-sm">
                    {page > 1 ? (
                      <Link
                        href={link({ page: String(page - 1) })}
                        className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-surface px-5 font-semibold text-ink transition hover:border-ink active:scale-95"
                      >
                        <ArrowLeft className="size-4" aria-hidden />
                        Sebelumnya
                      </Link>
                    ) : (
                      <span className="w-28" />
                    )}
                    <span className="text-muted">
                      Halaman <span className="font-semibold text-ink">{page}</span> dari {result.totalPages}
                    </span>
                    {page < result.totalPages ? (
                      <Link
                        href={link({ page: String(page + 1) })}
                        className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-canvas transition hover:bg-ink/85 active:scale-95"
                      >
                        Berikutnya
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    ) : (
                      <span className="w-28" />
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
