import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/server/services/products";
import { BookingForm } from "@/components/booking-form";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const store = product.store;
  const rating = (product.ratingAvg ?? 4.9).toFixed(1);
  const reviewsCount = product.ratingCount ?? 42;
  const rentalCount = product.rentalCount ?? 65;

  return (
    <div className="min-h-screen bg-[#fbfbfd] py-10">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/search" className="hover:text-slate-900 transition-colors">
            Katalog
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">
            {product.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Image Gallery & Store Profile (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Image */}
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-200/90 shadow-sm">
              <img
                src={`/api/files/${product.photos[0]}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md text-white text-xs font-mono font-medium px-3 py-1 rounded-xl shadow">
                📍 {store.city || "Jakarta Selatan"}
              </div>
              <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-xl shadow-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Unit Siap Disewa</span>
              </div>
            </div>

            {/* Thumbnail Photos if any */}
            {product.photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {product.photos.map((photo, i) => (
                  <div
                    key={i}
                    className="relative aspect-4/3 w-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                  >
                    <img
                      src={`/api/files/${photo}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Product Detailed Description */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>📋</span>
                <span>Detail & Spesifikasi Unit</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>

              {product.rentalTerms && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700 mb-2">
                    Syarat & Ketentuan Sewa
                  </h3>
                  <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {product.rentalTerms}
                  </p>
                </div>
              )}
            </div>

            {/* Verified Store Profile Card */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-xl shadow">
                    {store.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-slate-900">
                        {store.name}
                      </h3>
                      <span className="text-blue-600" title="Toko Terverifikasi PinjeS">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {store.address ? `${store.address}, ${store.city}` : store.city}
                    </p>
                  </div>
                </div>

                {store.whatsapp && (
                  <a
                    href={`https://wa.me/62${store.whatsapp.replace(/^0/, "")}?text=${encodeURIComponent(`Halo ${store.name}, saya melihat barang ${product.name} di PinjeS dan ingin konfirmasi jadwal sewa.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>💬</span>
                    <span>Chat Toko</span>
                  </a>
                )}
              </div>

              {store.description && (
                <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 leading-relaxed">
                  {store.description}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <span>⏱ Jam Buka: 08:00 - 21:00 WIB</span>
                <span className="text-emerald-600 font-semibold font-mono">
                  ● Toko Aktif & Respons Cepat
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Booking Deck (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xl space-y-5">
              {/* Category & Verified Badge */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider">
                  {product.categoryName}
                </span>
                <span className="font-mono text-xs font-bold text-amber-500 flex items-center gap-1">
                  ★ {rating} ({reviewsCount} Ulasan)
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 leading-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  ⚡ {rentalCount}x Berhasil Disewa Tanpa Kendala
                </p>
              </div>

              {/* Price Tag */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 block tracking-wider">
                    Tarif Rental Resmi
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-slate-950">
                      Rp {product.pricePerDay.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ hari</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                    Uang Jaminan
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {product.deposit === 0 ? "Bebas Deposit (KTP)" : `Rp ${product.deposit.toLocaleString("id-ID")}`}
                  </span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3 text-xs text-blue-900">
                <span className="text-lg">🛡️</span>
                <div>
                  <span className="font-bold block">Proteksi PinjeS Guard™</span>
                  <span className="text-[11px] text-blue-700">
                    Verifikasi identitas instan, serah terima kode QR anti-penipuan, dan perlindungan kerusakan.
                  </span>
                </div>
              </div>

              {/* Booking Form Integration */}
              <div className="pt-2">
                <BookingForm
                  productId={product.id}
                  pricePerDay={product.pricePerDay}
                  securityDeposit={product.deposit}
                />
              </div>
            </div>

            {/* Quick Handover Guide */}
            <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200/80 text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Protokol Serah Terima 2026</span>
              </h4>
              <ul className="space-y-1.5 text-slate-500 list-disc list-inside">
                <li>Bisa ambil mandiri ke toko atau diantar kurir instan 15 menit.</li>
                <li>Pengecekan fisik barang bersama pemilik sebelum scan kode QR.</li>
                <li>Pembayaran aman langsung ke QRIS/Rekening toko resmi.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
