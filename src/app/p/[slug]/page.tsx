import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Info, MapPin, MessageCircle, Star } from "lucide-react";
import { getProductBySlug } from "@/server/services/products";
import { getCurrentUser } from "@/server/session";
import { formatRupiah } from "@/lib/format";
import { BookingForm } from "@/components/booking-form";
import { ProductGallery } from "@/components/product-gallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Barang tidak ditemukan | PinjeS" };
  return {
    title: `${product.name} | PinjeS`,
    description: product.description.slice(0, 155),
  };
}

// 0812..., 812..., 62812... -> 62812...
function whatsappHref(raw: string, message: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("62") ? digits : digits.startsWith("0") ? `62${digits.slice(1)}` : `62${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const viewer = await getCurrentUser();
  const product = await getProductBySlug(slug, viewer);

  if (!product) notFound();

  const store = product.store;
  const isPreview = product.status !== "ACTIVE" || store.status !== "ACTIVE";
  const waLink = store.whatsapp
    ? whatsappHref(
      store.whatsapp,
      `Halo ${store.name}, saya melihat ${product.name} di PinjeS dan ingin menanyakan ketersediaannya.`,
    )
    : null;

  return (
    <div className="bg-white py-10">
      <div className="container mx-auto max-w-6xl px-4">
        <nav aria-label="Navigasi halaman" className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Beranda
          </Link>
          <span aria-hidden>/</span>
          <Link href="/search" className="hover:text-slate-900">
            Cari barang
          </Link>
          <span aria-hidden>/</span>
          <span className="max-w-xs truncate font-semibold text-slate-900">{product.name}</span>
        </nav>

        {isPreview && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Ini pratinjau. Barang atau tokomu belum aktif, jadi halaman ini tidak tampil di pencarian dan belum bisa
              dipesan.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Kiri */}
          <div className="space-y-6 lg:col-span-7">
            <ProductGallery photos={product.photos} alt={product.name} />

            <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">Deskripsi barang</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{product.description}</p>

              {product.rentalTerms && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Syarat dan ketentuan sewa</h3>
                  <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-600">
                    {product.rentalTerms}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white"
                  >
                    {store.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900">{store.name}</h3>
                    <p className="mt-0.5 flex items-start gap-1 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>{store.address ? `${store.address}, ${store.city}` : store.city || "Alamat belum diisi"}</span>
                    </p>
                  </div>
                </div>

                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Chat toko
                  </a>
                )}
              </div>

              {store.description && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
                  {store.description}
                </p>
              )}

              {store.openingHours && (
                <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden />
                  Jam buka: {store.openingHours}
                </p>
              )}
            </section>
          </div>

          {/* Kanan */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                  {product.categoryName}
                </span>
                {product.ratingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {product.ratingAvg.toFixed(1)} ({product.ratingCount} ulasan)
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{product.name}</h1>
                {product.rentalCount > 0 && (
                  <p className="mt-1 text-sm text-slate-500">Sudah disewa {product.rentalCount}x</p>
                )}
              </div>

              <div className="flex items-baseline justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <span className="block text-xs text-slate-500">Tarif sewa</span>
                  <span className="text-3xl font-bold text-slate-950">{formatRupiah(product.pricePerDay)}</span>
                  <span className="text-sm text-slate-500"> / hari</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-slate-500">Uang jaminan</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {product.deposit === 0 ? "Tanpa jaminan" : formatRupiah(product.deposit)}
                  </span>
                </div>
              </div>

              {isPreview ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  Form pemesanan tidak ditampilkan selama barang atau toko belum aktif.
                </p>
              ) : (
                <BookingForm
                  productId={product.id}
                  pricePerDay={product.pricePerDay}
                  securityDeposit={product.deposit}
                  minRentalDays={product.minRentalDays}
                  maxRentalDays={product.maxRentalDays}
                />
              )}
            </div>

            <section className="space-y-2 rounded-2xl border border-slate-200 p-5 text-sm text-slate-600">
              <h2 className="font-semibold text-slate-900">Cara pembayaran dan pengambilan</h2>
              <ul className="list-inside list-disc space-y-1.5 text-slate-500">
                <li>Setelah memesan, transfer langsung ke rekening atau QRIS toko.</li>
                <li>Unggah bukti pembayaran. Toko akan memeriksa dan mengonfirmasinya.</li>
                <li>Ambil dan kembalikan barang di lokasi toko sesuai tanggal sewa.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}