import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Info, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { getProductBySlug } from "@/server/services/products";
import { getCurrentUser } from "@/server/session";
import { env } from "@/server/env";
import { formatRupiah } from "@/lib/format";
import { BookingForm } from "@/components/booking-form";
import { BookingPanel } from "@/components/booking-panel";
import { ProductGallery } from "@/components/product-gallery";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Barang tidak ditemukan | PinjeS" };

  const image = product.photos[0] ? `${env.appUrl}/api/files/${product.photos[0]}` : undefined;
  return {
    title: `${product.name} | PinjeS`,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: image ? [{ url: image }] : undefined,
    },
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

  // Data terstruktur supaya Google bisa menampilkan harga dan rating di hasil pencarian.
  const jsonLd = isPreview
    ? null
    : {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.photos.map((p) => `${env.appUrl}/api/files/${p}`),
      category: product.categoryName,
      offers: {
        "@type": "Offer",
        url: `${env.appUrl}/p/${product.slug}`,
        priceCurrency: "IDR",
        price: product.pricePerDay,
        availability: "https://schema.org/InStock",
      },
      ...(product.ratingCount > 0
        ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.ratingAvg.toFixed(1)),
            reviewCount: product.ratingCount,
          },
        }
        : {}),
    };

  return (
    <div className="pb-8 pt-4 md:pt-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          // "<" di-escape supaya teks deskripsi tidak bisa menutup tag script.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <div className="shell">
        <nav aria-label="Navigasi halaman" className="mb-5 flex items-center gap-1.5 text-xs font-medium text-muted md:mb-8">
          <Link href="/" className="transition-colors hover:text-ink">
            Beranda
          </Link>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          <Link href="/search" className="transition-colors hover:text-ink">
            Jelajahi
          </Link>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          <span aria-current="page" className="truncate font-semibold text-ink">
            {product.name}
          </span>
        </nav>

        {isPreview && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl border border-yellow-300/60 bg-yellow-50 p-4 text-sm text-yellow-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Ini pratinjau. Barang atau tokomu belum aktif, jadi halaman ini tidak tampil di pencarian dan belum bisa
              dipesan.
            </p>
          </div>
        )}

        {/* Judul dan harga, satu baris penuh di semua ukuran layar */}
        <Reveal immediate className="mb-6 md:mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand">
              {product.categoryName}
            </span>
            {product.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink ring-1 ring-line">
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {product.ratingAvg.toFixed(1)}
                <span className="font-normal text-muted">({product.ratingCount} ulasan)</span>
              </span>
            )}
            {product.rentalCount > 0 && (
              <span className="text-xs text-muted">Sudah disewa {product.rentalCount}x</span>
            )}
          </div>

          <h1 className="text-title mt-4 max-w-4xl text-ink">{product.name}</h1>

          <dl className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-3">
            <div>
              <dt className="text-xs text-muted">Tarif sewa</dt>
              <dd className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                {formatRupiah(product.pricePerDay)}
                <span className="text-base font-normal text-muted"> / hari</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Uang jaminan</dt>
              <dd className="text-lg font-semibold text-ink">
                {product.deposit === 0 ? "Tanpa jaminan" : formatRupiah(product.deposit)}
              </dd>
            </div>
          </dl>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 2xl:gap-16">
          {/* Kiri: foto, deskripsi, toko */}
          <div className="space-y-6 lg:col-span-7 2xl:col-span-8">
            <Reveal immediate delay={0.08}>
              <ProductGallery photos={product.photos} alt={product.name} />
            </Reveal>

            <Reveal>
              <section className="rounded-[1.75rem] bg-surface p-6 ring-1 ring-line md:rounded-[2rem] md:p-8">
                <h2 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">Tentang barang ini</h2>
                <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-muted">{product.description}</p>

                {product.rentalTerms && (
                  <div className="mt-6 border-t border-line pt-6">
                    <h3 className="text-sm font-semibold text-ink">Syarat dan ketentuan sewa</h3>
                    <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-canvas p-4 text-sm leading-relaxed text-muted">
                      {product.rentalTerms}
                    </p>
                  </div>
                )}
              </section>
            </Reveal>

            <Reveal>
              <section className="rounded-[1.75rem] bg-surface p-6 ring-1 ring-line md:rounded-[2rem] md:p-8">
                <p className="text-eyebrow text-brand">Disewakan oleh</p>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      aria-hidden
                      className="grid size-14 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-bold text-signal"
                    >
                      {store.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-semibold tracking-tight text-ink">{store.name}</h3>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>{store.address ? `${store.address}, ${store.city}` : store.city || "Alamat belum diisi"}</span>
                      </p>
                    </div>
                  </div>

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink transition hover:border-ink hover:bg-canvas active:scale-95"
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      Chat toko
                    </a>
                  )}
                </div>

                {store.description && (
                  <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed text-muted">{store.description}</p>
                )}

                {store.openingHours && (
                  <p className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    Jam buka: {store.openingHours}
                  </p>
                )}
              </section>
            </Reveal>
          </div>

          {/* Kanan: pemesanan (menempel di layar lebar) */}
          <div className="space-y-5 lg:col-span-5 2xl:col-span-4">
            <div className="space-y-5 lg:sticky lg:top-28">
              {isPreview ? (
                <p className="rounded-[1.75rem] bg-surface p-6 text-sm text-muted ring-1 ring-line">
                  Form pemesanan tidak ditampilkan selama barang atau toko belum aktif.
                </p>
              ) : (
                <BookingPanel pricePerDay={product.pricePerDay} productName={product.name}>
                  <BookingForm
                    productId={product.id}
                    pricePerDay={product.pricePerDay}
                    securityDeposit={product.deposit}
                    minRentalDays={product.minRentalDays}
                    maxRentalDays={product.maxRentalDays}
                  />
                </BookingPanel>
              )}

              <section className="rounded-[1.75rem] bg-brand-soft/60 p-6 text-sm text-ink ring-1 ring-brand/10">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
                  <ShieldCheck className="size-5 text-brand" aria-hidden />
                  Cara pembayaran dan pengambilan
                </h2>
                <ol className="mt-4 space-y-3 text-muted">
                  <li className="flex gap-3">
                    <span className="font-display font-bold text-brand">1</span>
                    Setelah memesan, transfer langsung ke rekening atau QRIS toko.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display font-bold text-brand">2</span>
                    Unggah bukti pembayaran. Toko akan memeriksa dan mengonfirmasinya.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display font-bold text-brand">3</span>
                    Ambil dan kembalikan barang di lokasi toko sesuai tanggal sewa.
                  </li>
                </ol>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
