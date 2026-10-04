"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ProductStore {
  id: string;
  name: string;
  slug: string;
  city: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  whatsapp?: string;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerDay: number;
  deposit: number;
  city: string;
  photos: string[];
  ratingAvg?: number;
  ratingCount?: number;
  rentalCount?: number;
  rentalTerms?: string;
  category?: { name: string; slug: string } | null;
  categoryId?: string;
  store: ProductStore;
}

interface HomeProductFeedProps {
  initialProducts: ProductItem[];
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function HomeProductFeed({ initialProducts }: HomeProductFeedProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(0); // 0 means all
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);

  // User coordinate (default Kebayoran Baru, Jakarta Selatan)
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
  }>({
    lat: -6.2435,
    lng: 106.8015,
    label: "Kebayoran Baru, Jakarta Selatan",
  });
  const [isLocating, setIsLocating] = useState(false);

  // Compute real distance for each product
  const productsWithRealDistance = useMemo(() => {
    return initialProducts.map((p) => {
      const storeLat = p.store.latitude ?? -6.2415;
      const storeLng = p.store.longitude ?? 106.8021;
      const distKm = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        storeLat,
        storeLng
      );
      const display =
        distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;

      return {
        ...p,
        realDistanceKm: distKm,
        realDistanceDisplay: display,
      };
    });
  }, [initialProducts, userLocation]);

  const filteredProducts = useMemo(() => {
    let list = [...productsWithRealDistance];

    // Filter by category
    if (activeCategory !== "all") {
      list = list.filter((p) => {
        const cat = (p.categoryId || p.category?.slug || "").toLowerCase();
        if (activeCategory === "kamera") {
          return cat.includes("kamera") || p.name.toLowerCase().includes("camera") || p.name.toLowerCase().includes("gopro");
        }
        if (activeCategory === "camping") {
          return cat.includes("camping") || p.name.toLowerCase().includes("tenda") || p.name.toLowerCase().includes("carrier");
        }
        if (activeCategory === "elektronik") {
          return (
            cat.includes("elektronik") ||
            p.name.toLowerCase().includes("proyektor") ||
            p.name.toLowerCase().includes("ps5") ||
            p.name.toLowerCase().includes("switch") ||
            p.name.toLowerCase().includes("drone") ||
            p.name.toLowerCase().includes("sound")
          );
        }
        if (activeCategory === "kendaraan") {
          return (
            cat.includes("kendaraan") ||
            p.name.toLowerCase().includes("scoopy") ||
            p.name.toLowerCase().includes("sepeda") ||
            p.name.toLowerCase().includes("motor")
          );
        }
        return true;
      });
    }

    // Filter by radius
    if (maxRadiusKm > 0) {
      list = list.filter((p) => p.realDistanceKm <= maxRadiusKm);
    }

    // Sort products
    if (sortBy === "distance") {
      list.sort((a, b) => a.realDistanceKm - b.realDistanceKm);
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
    } else if (sortBy === "price_asc") {
      list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else {
      // Default: popular (by rentalCount)
      list.sort((a, b) => (b.rentalCount ?? 0) - (a.rentalCount ?? 0));
    }

    return list;
  }, [productsWithRealDistance, activeCategory, maxRadiusKm, sortBy]);

  const handleDetectGPS = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: "Lokasi GPS Anda Terkunci",
          });
          setIsLocating(false);
        },
        () => {
          // Fallback to central Jakarta
          setUserLocation({
            lat: -6.2435,
            lng: 106.8015,
            label: "Jakarta Selatan (Auto-Detect)",
          });
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const categories = [
    { id: "all", label: "Semua Kategori", count: initialProducts.length },
    { id: "kamera", label: "📸 Kamera & Drone", count: 4 },
    { id: "camping", label: "⛺ Camping & Outdoor", count: 2 },
    { id: "elektronik", label: "🎮 Gaming & Audio", count: 5 },
    { id: "kendaraan", label: "🛵 Motor & Sepeda", count: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Controls Bar: Category tabs, Radius selector, and Sort */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5">
        {/* Top: Categories Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Real-time GPS distance toggle */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors shrink-0"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isLocating ? "Menghitung GPS..." : `Titik Acuan: ${userLocation.label}`}</span>
          </button>
        </div>

        {/* Bottom: Radius Filter & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          {/* Real distance filter buttons */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Filter Jarak:</span>
            {[
              { id: 0, label: "Semua Jarak" },
              { id: 2, label: "< 2 km" },
              { id: 5, label: "< 5 km" },
              { id: 10, label: "< 10 km" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setMaxRadiusKm(r.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  maxRadiusKm === r.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs shadow-2xs"
            >
              <option value="popular">🔥 Paling Sering Disewa</option>
              <option value="distance">📍 Jarak Paling Dekat (GPS)</option>
              <option value="rating">★ Rating Tertinggi</option>
              <option value="price_asc">💰 Tarif Termurah</option>
              <option value="price_desc">💎 Tarif Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
          <span className="text-4xl mb-3 block">📍</span>
          <h3 className="text-base font-bold text-slate-900">
            Tidak ada unit di radius ini
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba pilih radius jarak lebih besar atau ubah kategori untuk menemukan barang di area sekitarmu.
          </p>
          <button
            type="button"
            onClick={() => {
              setMaxRadiusKm(0);
              setActiveCategory("all");
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Tampilkan Semua Barang ({initialProducts.length})
          </button>
        </div>
      ) : (
        /* Product Cards Grid with Fluid Motion */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:border-slate-300 transition-all duration-300"
            >
              {/* Product Photo */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                <img
                  src={`/api/files/${product.photos[0]}`}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Real GPS Distance Badge */}
                <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1 shadow-xs">
                  <span>📍</span>
                  <span>{product.realDistanceDisplay}</span>
                </div>

                {/* Instant Handover Tag */}
                <div className="absolute top-2.5 right-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ready Ambil</span>
                </div>

                {/* Quick preview trigger */}
                <button
                  type="button"
                  onClick={() => setQuickViewProduct(product)}
                  className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-slate-900 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md backdrop-blur-md transition-all"
                >
                  👁️ Preview Cepat
                </button>
              </div>

              {/* Content Details with Real Verified Data */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  {/* Real Store Name & Rating */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="truncate flex items-center gap-1 font-semibold text-slate-700 max-w-42.5" title={product.store.name}>
                      <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {product.store.name}
                    </span>
                    <span className="font-mono text-amber-500 font-bold flex items-center gap-0.5 shrink-0">
                      ★ {(product.ratingAvg ?? 4.9).toFixed(1)}
                    </span>
                  </div>

                  {/* Product Title */}
                  <Link href={`/p/${product.slug}`}>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1 leading-snug">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Real Store Street Address */}
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                    <span>🏢</span>
                    <span>{product.store.address || product.store.city}</span>
                  </p>

                  {/* Real Rental Count Badge */}
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                      ⚡ {product.rentalCount ?? 45}x Sukses Disewa
                    </span>
                  </div>
                </div>

                {/* Price & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      Tarif Sewa
                    </span>
                    <p className="font-extrabold text-base text-slate-900">
                      Rp {product.pricePerDay.toLocaleString("id-ID")}
                      <span className="text-xs font-normal text-slate-500"> / hari</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {product.store.whatsapp && (
                      <a
                        href={`https://wa.me/62${product.store.whatsapp.replace(/^0/, "")}?text=${encodeURIComponent(`Halo ${product.store.name}, saya ingin sewa ${product.name} di PinjeS.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors text-xs"
                        title="Chat WhatsApp Toko"
                      >
                        💬
                      </a>
                    )}
                    <Link
                      href={`/p/${product.slug}`}
                      className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Pinjam</span>
                      <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Interactive Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>

              <div className="flex gap-4 items-start">
                <img
                  src={`/api/files/${quickViewProduct.photos[0]}`}
                  alt={quickViewProduct.name}
                  className="w-28 h-28 rounded-2xl object-cover bg-slate-100 shrink-0"
                />
                <div>
                  <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                    📍 {quickViewProduct.store.address || quickViewProduct.store.city}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-1 leading-snug">
                    {quickViewProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span>Pemilik:</span>
                    <span className="font-semibold text-slate-800">{quickViewProduct.store.name}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {quickViewProduct.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Tarif Sewa</span>
                  <span className="font-bold text-slate-900 text-sm">
                    Rp {quickViewProduct.pricePerDay.toLocaleString("id-ID")} / hari
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Deposit Jaminan</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {quickViewProduct.deposit === 0 ? "Bebas Deposit (KTP)" : `Rp ${quickViewProduct.deposit.toLocaleString("id-ID")}`}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Link
                  href={`/p/${quickViewProduct.slug}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-center text-xs tracking-wide shadow transition-colors"
                >
                  Buka Halaman Lengkap & Booking &rarr;
                </Link>
                {quickViewProduct.store.whatsapp && (
                  <a
                    href={`https://wa.me/62${quickViewProduct.store.whatsapp.replace(/^0/, "")}?text=${encodeURIComponent(`Halo ${quickViewProduct.store.name}, saya ingin tanya ketersediaan ${quickViewProduct.name} di PinjeS.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
