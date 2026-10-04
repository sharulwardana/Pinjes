import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Camera,
  CreditCard,
  Gamepad2,
  Package,
  PackageCheck,
  Search,
  Speaker,
  Tent,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/server/db";
import { searchProducts } from "@/server/services/products";
import { LocationSearchBar } from "@/components/location-search-bar";
import { HomeProductFeed } from "@/components/home-product-feed";

// Kolom Category.icon berisi nama ikon. Yang tidak dikenal memakai ikon kotak.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  camera: Camera,
  tent: Tent,
  gamepad: Gamepad2,
  "gamepad-2": Gamepad2,
  bike: Bike,
  speaker: Speaker,
  package: Package,
};

const STEPS = [
  {
    icon: Search,
    title: "Cari barang dan pilih tanggal",
    text: "Temukan barang yang kamu butuhkan, lalu pilih tanggal sewa. Tanggal yang sudah penuh tidak bisa dipesan.",
  },
  {
    icon: CreditCard,
    title: "Bayar langsung ke toko",
    text: "Transfer ke rekening atau QRIS toko, lalu unggah bukti pembayaran. Toko memeriksanya dan mengonfirmasi pesananmu.",
  },
  {
    icon: PackageCheck,
    title: "Ambil dan kembalikan di toko",
    text: "Ambil barang di lokasi toko sesuai tanggal sewa dan kembalikan di sana. Uang jaminan dikembalikan sesuai ketentuan toko.",
  },
];

export default async function Home() {
  const [result, categories] = await Promise.all([
    searchProducts({ sort: "popular", page: 1 }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, icon: true },
    }),
  ]);

  return (
    <main className="flex-1 bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200">
        <div className="container mx-auto max-w-5xl px-4 py-14 md:py-20">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Sewa barang dari toko rental di sekitarmu.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            Kamera, tenda, konsol game, sepeda motor, dan banyak lagi. Pilih barang, bayar langsung ke toko, lalu ambil
            sesuai tanggal sewa.
          </p>
          <div className="mt-8">
            <LocationSearchBar />
          </div>
        </div>
      </section>

      {/* Kategori */}
      {categories.length > 0 && (
        <section className="border-b border-slate-200 py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Kategori</h2>
              <Link
                href="/search"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:underline"
              >
                Lihat semua barang
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => {
                const Icon = CATEGORY_ICONS[c.icon.toLowerCase()] ?? Package;
                return (
                  <Link
                    key={c.id}
                    href={`/search?category=${encodeURIComponent(c.slug)}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-400"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-slate-700" aria-hidden />
                    <span className="text-sm font-medium text-slate-900">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Barang populer */}
      <section className="border-b border-slate-200 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Barang populer</h2>
            {result.total > 0 && (
              <Link
                href="/search"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:underline"
              >
                Lihat semua {result.total} barang
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>

          {result.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">
              Belum ada barang yang tersedia.
            </p>
          ) : (
            <HomeProductFeed initialProducts={result.items} />
          )}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="border-b border-slate-200 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Cara menyewa</h2>

          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <step.icon className="h-5 w-5 text-slate-600" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ajakan untuk pemilik toko */}
      <section className="bg-slate-950 py-12 text-white md:py-16">
        <div className="container mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 px-4 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Punya toko rental?</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Daftarkan tokomu dan terima pesanan dari pelanggan sekitar. Uang sewa dibayar langsung ke rekening atau QRIS
              tokomu. Biaya layanan per pesanan dipotong dari saldo deposit toko.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-white px-6 py-3 text-center text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
            >
              Daftarkan toko
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-600 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Masuk akun toko
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}