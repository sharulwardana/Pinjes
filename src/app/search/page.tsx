import Link from "next/link";
import { searchProducts } from "@/server/services/products";
import { PRODUCT_CATEGORIES } from "@/features/products/schemas";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const p = await searchParams;
  const q = typeof p.q === "string" ? p.q : undefined;
  const category = (typeof p.category === "string" && PRODUCT_CATEGORIES.includes(p.category as any)) ? p.category as any : undefined;
  const sort = typeof p.sort === "string" ? p.sort as any : "popular";
  const page = typeof p.page === "string" ? parseInt(p.page, 10) : 1;

  const result = await searchProducts({ q, category, sort, page: isNaN(page) ? 1 : page });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 shrink-0 space-y-8">
        <div>
          <h3 className="font-semibold mb-4 text-zinc-900">Kategori</h3>
          <ul className="space-y-2">
            <li>
              <Link href={`/search?q=${q || ""}`} className={`text-sm ${!category ? "font-bold text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`}>
                Semua Kategori
              </Link>
            </li>
            {PRODUCT_CATEGORIES.map((c) => (
              <li key={c}>
                <Link
                  href={`/search?category=${c}&q=${q || ""}`}
                  className={`text-sm capitalize ${category === c ? "font-bold text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`}
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {q ? `Hasil pencarian untuk "${q}"` : category ? `Kategori: ${category}` : "Semua Barang"}
            <span className="ml-2 text-sm font-normal text-zinc-500">({result.total} barang)</span>
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-500">Urutkan:</span>
            <div className="flex space-x-1">
              {["popular", "newest", "price_asc"].map((s) => (
                <Link key={s} href={`/search?sort=${s}&category=${category || ""}&q=${q || ""}`}>
                  <Button variant={sort === s ? "secondary" : "ghost"} size="sm" className="h-8 capitalize">
                    {s.replace("_", " ")}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {result.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-24 text-center bg-slate-50">
            <span className="text-3xl mb-3">🔍</span>
            <p className="text-lg font-bold text-slate-900">Barang Belum Ditemukan</p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">Coba gunakan kata kunci umum seperti &quot;kamera&quot;, &quot;tenda&quot;, &quot;drone&quot;, atau &quot;motor&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {result.items.map((product, idx) => {
              const distances = ["450 m", "800 m", "1.2 km", "1.8 km", "2.4 km", "3.5 km", "4.2 km"];
              const dist = distances[idx % distances.length];
              return (
                <Link 
                  key={product.id} 
                  href={`/p/${product.slug}`} 
                  className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={`/api/files/${product.photos[0]}`} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1 shadow-xs">
                      <span>📍</span>
                      <span>{dist}</span>
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Ready</span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="truncate flex items-center gap-1 font-medium text-slate-600">
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {product.store.name}
                        </span>
                        <span className="font-semibold text-amber-500 flex items-center gap-0.5">
                          ★ 4.9
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {product.store.city || "Jakarta Selatan"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                          Tarif Sewa
                        </span>
                        <p className="font-extrabold text-base text-slate-900">
                          Rp {product.pricePerDay.toLocaleString("id-ID")}
                          <span className="text-xs font-normal text-slate-500"> / hari</span>
                        </p>
                      </div>
                      <div className="h-8 px-3 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors">
                        <span>Pinjam</span>
                        <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
