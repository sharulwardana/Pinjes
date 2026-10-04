import Link from "next/link";
import { searchProducts } from "@/server/services/products";
import { LocationSearchBar } from "@/components/location-search-bar";
import { HeroRadarSimulator } from "@/components/hero-radar-simulator";
import { HomeProductFeed } from "@/components/home-product-feed";

export default async function Home() {
  const result = await searchProducts({ sort: "popular", page: 1 });

  return (
    <main className="flex-1 bg-[#fbfbfd]">
      {/* Hero Command Center - 2026 Asymmetric Spatial Layout */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 border-b border-slate-200/80 bg-tech-grid">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Top Live Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-200/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono font-semibold text-slate-800 tracking-wider">
                PINJES RADAR v2.6 • JARINGAN SEWA O2O AKTIF
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 font-mono text-[11px] text-slate-500">
              <span>LATENSI: 24ms</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">13 UNIT SIAP DISPATCH</span>
              <span>•</span>
              <span>JAKARTA & JABODETABEK</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Command & Value Proposition */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                Pinjam Sebentar (PinjeS) — Universal On-Demand Rental
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08]">
                Sewa Apa Saja, <br />
                <span className="text-slate-900">
                  Dari Tetangga Terdekat.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Platform rental universal nomor satu untuk kreator, traveler, gamer, dan event.
                Ambil kamera sinema, drone 4K, tenda camping, motor, hingga konsol game
                langsung dari pemilik lokal dengan jaminan aman tanpa jaminan ribet.
              </p>

              {/* Dynamic Command Search Deck */}
              <div className="mt-8 w-full">
                <LocationSearchBar />
              </div>

              {/* High-Tech Trust Strips */}
              <div className="mt-10 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 w-full max-w-xl">
                <div>
                  <span className="block text-xl sm:text-2xl font-black text-slate-950">
                    ⚡ 15 Menit
                  </span>
                  <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                    Rata-rata waktu siap ambil
                  </span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black text-slate-950">
                    🛡️ 100% Aman
                  </span>
                  <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                    Proteksi PinjeS Guard™
                  </span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black text-emerald-600">
                    💰 Hemat 90%
                  </span>
                  <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                    Dibanding beli barang baru
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Radar Simulator */}
            <div className="lg:col-span-5">
              <HeroRadarSimulator products={result.items as any} />
            </div>
          </div>
        </div>
      </section>

      {/* Universal Rental Categories - Bento Grid */}
      <section className="py-14 md:py-20 border-b border-slate-200/80 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 block mb-1">
                UNIVERSAL INVENTORY DIRECTORY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                Kategori Rental Universal
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Apapun kebutuhan spesifikmu hari ini, selalu ada unit terdekat yang siap dipinjam.
              </p>
            </div>
            <Link
              href="/search"
              className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 group"
            >
              <span>Jelajah Semua Kategori</span>
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>

          {/* Bento Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Tile 1: Kamera & Sinema */}
            <Link
              href="/search?category=kamera"
              className="group relative rounded-2xl bg-slate-50 border border-slate-200/90 p-5 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">📸</span>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Kamera & Sinema
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mirrorless, Cinema Lens, Gimbal Stabilizer, Flash
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-700">
                <span>Mulai Rp 150rb/hari</span>
                <span className="text-blue-600">&rarr;</span>
              </div>
            </Link>

            {/* Tile 2: Camping & Outdoor */}
            <Link
              href="/search?category=camping"
              className="group relative rounded-2xl bg-slate-50 border border-slate-200/90 p-5 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">⛺</span>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Outdoor & Camping
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tenda Dome, Carrier 60L, Kompor Portable, Matras
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-700">
                <span>Mulai Rp 50rb/hari</span>
                <span className="text-blue-600">&rarr;</span>
              </div>
            </Link>

            {/* Tile 3: Gaming & Hiburan */}
            <Link
              href="/search?category=elektronik"
              className="group relative rounded-2xl bg-slate-50 border border-slate-200/90 p-5 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">🎮</span>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Gaming & Proyektor
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  PlayStation 5 Slim, Nintendo Switch, Proyektor Bioskop
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-700">
                <span>Mulai Rp 150rb/hari</span>
                <span className="text-blue-600">&rarr;</span>
              </div>
            </Link>

            {/* Tile 4: Motor & Sepeda */}
            <Link
              href="/search?category=kendaraan"
              className="group relative rounded-2xl bg-slate-50 border border-slate-200/90 p-5 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">🛵</span>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Motor & Sepeda
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Honda Scoopy 2024, Sepeda Lipat Urbano, Helm
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-700">
                <span>Mulai Rp 45rb/hari</span>
                <span className="text-blue-600">&rarr;</span>
              </div>
            </Link>

            {/* Tile 5: Event & Audio */}
            <Link
              href="/search?q=sound"
              className="group relative rounded-2xl bg-slate-50 border border-slate-200/90 p-5 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">🔊</span>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Audio & Sound Stage
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Portable Speaker Wireless, Mic Studio, Mixer
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-700">
                <span>Mulai Rp 180rb/hari</span>
                <span className="text-blue-600">&rarr;</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular & Nearby Products Section */}
      <section className="py-16 md:py-24 bg-[#fbfbfd]">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
                  DISPATCH LANGSUNG HARI INI
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Katalog Siap Ambil Terdekat
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Unit diverifikasi oleh PinjeS Guard™. Serah terima aman via kode QR instan.
              </p>
            </div>
            <Link
              href="/search"
              className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 group"
            >
              <span>Buka Semua {result.items.length} Katalog</span>
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>

          <HomeProductFeed initialProducts={result.items} />
        </div>
      </section>

      {/* How PinjeS Works - 2026 O2O Protocol */}
      <section className="py-16 md:py-24 border-t border-slate-200/80 bg-white">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 mb-2 block">
            THE PINJES PROTOCOL
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 max-w-2xl mx-auto">
            Rental Tanpa Drama, Selesai Dalam 3 Langkah Sederhana
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Teknologi radar pencarian lokasi dan sistem verifikasi aman kami dirancang agar kamu bisa menyewa secepat memesan makanan.
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div className="relative rounded-2xl bg-slate-50 p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-mono font-bold text-sm">
                  01
                </span>
                <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  RADAR GPS
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Pilih Barang di Sekitarmu
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gunakan filter radius jarak 2 km - 10 km untuk menemukan barang yang posisinya paling dekat dengan lokasimu saat ini. Ambil sendiri atau kirim via ojek instan.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl bg-slate-50 p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-mono font-bold text-sm">
                  02
                </span>
                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                  INSTANT CHECK
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Booking Tanpa Jaminan Ribet
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verifikasi identitas cepat dengan PinjeS Guard™. Tidak perlu menitipkan uang deposit puluhan juta atau jaminan surat berharga yang merepotkan.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl bg-slate-50 p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-mono font-bold text-sm">
                  03
                </span>
                <span className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                  ONE-TIME QR
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Serah Terima Kode QR Aman
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Saat bertemu pemilik toko, cukup scan kode QR sekali pakai untuk konfirmasi kondisi fisik dan aktivasi masa sewa. Aman bagi penyewa dan pemilik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Callout Banner */}
      <section className="py-14 border-t border-slate-200/80 bg-slate-950 text-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold mb-2 block">
              PINJES HOST & TOKO PARTNER
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Punya Barang Nganggur di Rumah? Sewakan & Hasilkan Cuan.
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Kamera jarang dipakai? Tenda numpuk di gudang? Sewakan ke komunitas terdekat dengan perlindungan PinjeS Guard™. Uang sewa masuk 100% langsung ke rekeningmu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm text-center shadow-lg transition-all hover:scale-105"
            >
              Mulai Sewakan Sekarang
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm text-center border border-slate-700 transition-colors"
            >
              Masuk Akun Toko
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
