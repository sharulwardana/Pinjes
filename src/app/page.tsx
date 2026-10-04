import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  Camera,
  CreditCard,
  Gamepad2,
  Package,
  PackageCheck,
  Search,
  Shirt,
  Speaker,
  Tent,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/server/db";
import { searchProducts } from "@/server/services/products";
import { LocationSearchBar } from "@/components/location-search-bar";
import { HomeProductFeed } from "@/components/home-product-feed";
import { HeroCollage } from "@/components/hero-collage";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";

// Kolom Category.icon berisi nama ikon. Kalau masih "package" (bawaan database),
// ikon dipilih dari slug kategori supaya tiap kategori punya ikon sendiri.
const ICON_BY_NAME: Record<string, LucideIcon> = {
  camera: Camera,
  tent: Tent,
  gamepad: Gamepad2,
  "gamepad-2": Gamepad2,
  bike: Bike,
  speaker: Speaker,
  shirt: Shirt,
};

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  kamera: Camera,
  camping: Tent,
  elektronik: Gamepad2,
  kendaraan: Bike,
  fashion: Shirt,
  lainnya: Package,
};

function categoryIcon(icon: string, slug: string): LucideIcon {
  const byName = ICON_BY_NAME[icon.toLowerCase()];
  if (byName) return byName;
  return ICON_BY_SLUG[slug] ?? Package;
}

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
  const [result, categories, storeCount] = await Promise.all([
    searchProducts({ sort: "popular", page: 1 }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, icon: true },
    }),
    db.store.count({ where: { status: "ACTIVE", deletedAt: null } }),
  ]);

  const stats = [
    { label: "Barang siap disewa", value: result.total },
    { label: "Toko rental", value: storeCount },
    { label: "Kategori", value: categories.length },
  ];

  return (
    <main className="flex-1">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 -z-10" />

        <div className="shell grid items-center gap-12 pb-16 pt-8 md:pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:pb-24 3xl:pt-20">
          <div>
            <Reveal immediate>
              <p className="text-eyebrow text-brand">Sewa lokal · Bayar langsung ke toko</p>
            </Reveal>

            <Reveal immediate delay={0.08}>
              <h1 className="text-display mt-5 text-ink">
                Pinjam apa pun,{" "}
                <span className="relative isolate inline-block">
                  <span
                    aria-hidden
                    className="absolute -inset-x-[0.08em] bottom-[0.04em] top-[0.5em] -z-10 -rotate-1 rounded-[0.2em] bg-signal"
                  />
                  sebentar
                </span>{" "}
                saja.
              </h1>
            </Reveal>

            <Reveal immediate delay={0.18}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted ml:text-lg">
                Kamera, tenda, konsol game, sepeda motor, dan banyak lagi dari toko rental di sekitarmu. Pilih barang,
                bayar langsung ke toko, lalu ambil sesuai tanggal sewa.
              </p>
            </Reveal>

            <Reveal immediate delay={0.28} className="mt-8">
              <LocationSearchBar />
            </Reveal>

            <Reveal immediate delay={0.4}>
              <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dt className="order-2 mt-1 text-xs leading-snug text-muted">{s.label}</dt>
                    <dd className="font-display text-3xl font-bold tracking-tight text-ink ml:text-4xl">
                      <CountUp value={s.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal immediate delay={0.2} y={40}>
            <HeroCollage products={result.items} />
          </Reveal>
        </div>
      </section>

      {/* ── Kategori ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-12 md:py-20">
          <div className="shell">
            <div className="mb-8 flex items-end justify-between gap-4">
              <Reveal>
                <h2 className="text-title text-ink">Mau sewa apa?</h2>
              </Reveal>
              <Link
                href="/search"
                className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-ink md:inline-flex"
              >
                Lihat semua barang
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>

            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
              {categories.map((c, i) => {
                const Icon = categoryIcon(c.icon, c.slug);
                return (
                  <li key={c.id}>
                    <Reveal delay={i * 0.05} y={20} className="h-full">
                      <Link
                        href={`/search?category=${encodeURIComponent(c.slug)}`}
                        className="group flex h-full min-h-36 flex-col justify-between rounded-[1.75rem] border border-line bg-surface p-5 transition duration-500 ease-out-expo hover:-translate-y-1 hover:border-ink hover:bg-ink hover:text-canvas"
                      >
                        <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand transition-colors duration-500 group-hover:bg-signal group-hover:text-ink">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span className="flex items-end justify-between gap-2">
                          <span className="font-display text-lg font-semibold leading-tight tracking-tight">{c.name}</span>
                          <ArrowUpRight
                            className="size-5 shrink-0 -translate-x-1 translate-y-1 opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                            aria-hidden
                          />
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ── Barang populer ───────────────────────────────────── */}
      <section className="py-12 md:py-20">
        <div className="shell">
          <div className="mb-8 flex items-end justify-between gap-4">
            <Reveal>
              <p className="text-eyebrow text-brand">Paling sering dipinjam</p>
              <h2 className="text-title mt-3 text-ink">Lagi banyak disewa</h2>
            </Reveal>
            {result.total > 0 && (
              <Link
                href="/search"
                className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-ink md:inline-flex"
              >
                Lihat semua {result.total} barang
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            )}
          </div>

          {result.items.length === 0 ? (
            <p className="rounded-[1.75rem] border border-dashed border-line py-20 text-center text-sm text-muted">
              Belum ada barang yang tersedia.
            </p>
          ) : (
            <HomeProductFeed initialProducts={result.items} />
          )}

          {result.total > 0 && (
            <Link
              href="/search"
              className="mt-8 flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-semibold text-ink md:hidden"
            >
              Lihat semua {result.total} barang
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </section>

      {/* ── Cara kerja ───────────────────────────────────────── */}
      <section className="py-6 md:py-12">
        <div className="shell">
          <div className="rounded-[2rem] bg-ink px-6 py-14 text-canvas md:rounded-[3rem] md:px-14 md:py-20">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <Reveal>
                <p className="text-eyebrow text-signal">Cara menyewa</p>
                <h2 className="text-title mt-4">Tiga langkah, tanpa ribet.</h2>
                <p className="mt-5 max-w-sm text-base leading-relaxed text-canvas/70">
                  Tidak ada saldo atau dompet digital. Kamu bayar langsung ke toko, jadi semuanya jelas dari awal.
                </p>
              </Reveal>

              <ol className="divide-y divide-white/10">
                {STEPS.map((step, i) => (
                  <li key={step.title}>
                    <Reveal delay={i * 0.08} className="flex gap-5 py-7 first:pt-0 last:pb-0 md:gap-8">
                      <span className="font-display text-5xl font-bold leading-none text-signal md:text-7xl">
                        0{i + 1}
                      </span>
                      <div>
                        <h3 className="flex items-center gap-3 font-display text-xl font-semibold tracking-tight md:text-2xl">
                          {step.title}
                          <step.icon className="hidden size-5 text-canvas/50 xs:block" aria-hidden />
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-canvas/70 md:text-base">{step.text}</p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ajakan untuk pemilik toko ────────────────────────── */}
      <section className="py-6 md:py-12">
        <div className="shell">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-signal px-6 py-14 text-ink md:rounded-[3rem] md:px-14 md:py-20">
              <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
                <div className="max-w-2xl">
                  <h2 className="text-title">Punya toko rental? Biar barangmu ketemu penyewanya.</h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/75">
                    Daftarkan tokomu dan terima pesanan dari pelanggan sekitar. Uang sewa dibayar langsung ke rekening atau
                    QRIS tokomu. Biaya layanan per pesanan dipotong dari saldo deposit toko.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 ml:flex-row lg:w-auto">
                  <Link
                    href="/register"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ink px-8 text-base font-semibold text-canvas transition duration-300 hover:bg-ink/85 active:scale-[0.97]"
                  >
                    Daftarkan toko
                    <ArrowUpRight className="size-5" aria-hidden />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-14 items-center justify-center rounded-full border border-ink/25 px-8 text-base font-semibold text-ink transition duration-300 hover:border-ink hover:bg-ink/5 active:scale-[0.97]"
                  >
                    Masuk akun toko
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
