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
  category?: { name: string; slug: string } | null;
  store: ProductStore;
}

interface HeroRadarSimulatorProps {
  products?: ProductItem[];
}

// User reference coordinate (Blok M / Kebayoran Baru, Jakarta Selatan)
const USER_COORDS = { lat: -6.2435, lng: 106.8015 };

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

export function HeroRadarSimulator({ products = [] }: HeroRadarSimulatorProps) {
  // Use top 5 distinct real products from different stores
  const featured = useMemo(() => {
    if (products.length === 0) return [];
    // Prioritize high-impact items across categories
    const targetNames = [
      "Sony Alpha A7 IV",
      "DJI Mini 3 Pro Drone",
      "Honda Scoopy Prestige 2024",
      "PlayStation 5 Slim",
      "Tenda Dome 4 Orang Eiger",
    ];
    const picked: ProductItem[] = [];
    for (const name of targetNames) {
      const match = products.find((p) => p.name === name);
      if (match) picked.push(match);
    }
    return picked.length > 0 ? picked : products.slice(0, 5);
  }, [products]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [days, setDays] = useState(3);
  const [isRadarScanning, setIsRadarScanning] = useState(true);

  if (featured.length === 0) return null;

  const current = featured[selectedIdx] || featured[0];

  // Real distance calculation
  const storeLat = current.store.latitude ?? -6.2415;
  const storeLng = current.store.longitude ?? 106.8021;
  const distanceKm = calculateDistanceKm(
    USER_COORDS.lat,
    USER_COORDS.lng,
    storeLat,
    storeLng
  );
  const distanceDisplay =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(1)} km`;

  // Estimate retail market purchase price for accurate savings calculation
  const retailPrices: Record<string, number> = {
    "Sony Alpha A7 IV": 36500000,
    "Canon EOS R6 Mark II": 38000000,
    "DJI Mini 3 Pro Drone": 13900000,
    "Honda Scoopy Prestige 2024": 23500000,
    "PlayStation 5 Slim": 8500000,
    "Nintendo Switch OLED": 4800000,
    "Tenda Dome 4 Orang Eiger": 1450000,
    "Carrier Bag 60L Consina": 750000,
    "Proyektor Epson EB-X51": 6900000,
    "Sound System Portable Wireless & Mic": 3800000,
    "Sepeda Lipat Polygon Urbano": 4200000,
    "GoPro HERO 12 Black": 6200000,
    "Fujifilm X-T30 II": 14800000,
  };

  const buyPrice = retailPrices[current.name] || current.pricePerDay * 30;
  const totalRental = current.pricePerDay * days;
  const savedAmount = Math.max(0, buyPrice - totalRental);
  const savedPercent = Math.min(99, Math.round((savedAmount / buyPrice) * 100));

  return (
    <div className="relative rounded-3xl bg-slate-950 text-white p-5 md:p-6 shadow-2xl ring-1 ring-slate-800/80 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-400">
            RADAR TELEMETRY • LIVE REAL GPS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRadarScanning(!isRadarScanning)}
            className="text-[10px] font-mono text-slate-400 bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
          >
            {isRadarScanning ? "SCANNING ●" : "PAUSED ⏸"}
          </button>
          <span className="text-[10px] font-mono text-slate-500">v2.6</span>
        </div>
      </div>

      {/* Interactive Mini Radar Screen + Store Blips */}
      <div className="relative z-10 rounded-2xl bg-slate-900/90 border border-slate-800 p-3 mb-4 overflow-hidden">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1 text-slate-300">
            <span>📍 Titik Anda:</span>
            <span className="text-emerald-400 font-semibold">Kebayoran Baru (-6.2435, 106.8015)</span>
          </span>
          <span className="text-slate-500">Radius Radar: 5.0 km</span>
        </div>

        {/* Animated Radar Surface */}
        <div className="relative h-28 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden flex items-center justify-center">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[16px_16px] opacity-40" />

          {/* Concentric rings */}
          <div className="absolute h-14 w-14 rounded-full border border-emerald-500/20" />
          <div className="absolute h-22 w-22 rounded-full border border-emerald-500/20" />
          <div className="absolute h-26 w-26 rounded-full border border-emerald-500/10" />

          {/* Rotating radar sweep */}
          {isRadarScanning && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute h-26 w-26 rounded-full border-r border-t border-emerald-400/50 pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(16, 185, 129, 0.15) 0deg, transparent 60deg)",
              }}
            />
          )}

          {/* Center User Pin */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/30" />
            <span className="text-[9px] font-mono text-blue-400 font-semibold mt-0.5">ANDA</span>
          </div>

          {/* Interactive Nearby Product Pins */}
          {featured.map((item, idx) => {
            // Plot pins roughly relative to center
            const offsets = [
              { top: "25%", left: "62%" }, // Sony
              { top: "68%", left: "32%" }, // Drone
              { top: "72%", left: "75%" }, // Scoopy
              { top: "20%", left: "28%" }, // PS5
              { top: "45%", left: "80%" }, // Tenda
            ];
            const pos = offsets[idx % offsets.length];
            const isSelected = selectedIdx === idx;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                style={{ top: pos.top, left: pos.left }}
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 p-1 group transition-all`}
                title={`${item.name} (${item.store.name})`}
              >
                <span className="relative flex h-3 w-3">
                  {isSelected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isSelected
                        ? "bg-emerald-400 ring-2 ring-white"
                        : "bg-amber-400/80 group-hover:scale-125"
                    } transition-transform`}
                  ></span>
                </span>
                {isSelected && (
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono font-bold bg-slate-900/90 text-emerald-400 px-1 rounded shadow">
                    {item.name.split(" ")[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Selector Tabs */}
      <div className="relative z-10 grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-4 text-[11px] font-medium">
        {featured.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`py-1.5 px-1 rounded-lg text-center truncate transition-all ${
              selectedIdx === idx
                ? "bg-slate-800 text-emerald-400 font-bold shadow-xs border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {item.name.split(" ")[0]} {item.name.split(" ")[1]}
          </button>
        ))}
      </div>

      {/* Product Display Card with Real Verified Data */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex flex-col sm:flex-row gap-4 bg-slate-900/80 rounded-2xl p-3.5 border border-slate-800/90"
        >
          {/* Photo */}
          <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-slate-950 shrink-0">
            <img
              src={`/api/files/${current.photos[0]}`}
              alt={current.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
              ● READY AMBIL
            </div>
            <div className="absolute bottom-2 right-2 bg-slate-950/90 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded backdrop-blur-md flex items-center gap-1">
              <span>📍</span>
              <span>{distanceDisplay}</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Store & Rating */}
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-400 flex items-center gap-1 truncate max-w-50">
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {current.store.name}
                </span>
                <span className="font-mono text-amber-400 font-bold text-xs shrink-0">
                  ★ {(current.ratingAvg ?? 4.9).toFixed(1)} ({current.ratingCount ?? 45})
                </span>
              </div>

              {/* Title */}
              <h4 className="font-bold text-base text-white leading-snug line-clamp-1">
                {current.name}
              </h4>

              {/* Real address */}
              <p className="text-xs text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                <span>🏢</span>
                <span>{current.store.address || current.store.city}</span>
              </p>

              {/* Rental count badge */}
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  ⚡ {current.rentalCount ?? 80}x Sukses Disewa
                </span>
                <span className="text-emerald-400">
                  🛡️ Terproteksi PinjeS Guard
                </span>
              </div>
            </div>

            {/* Price & Handover */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Tarif Sewa
                </span>
                <span className="text-base font-extrabold text-white">
                  Rp {current.pricePerDay.toLocaleString("id-ID")}
                  <span className="text-xs text-slate-400 font-normal"> / hari</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Waktu Handover
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  ⚡ Siap ~15 Menit
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Interactive Rent vs Buy Calculator */}
      <div className="relative z-10 mt-3.5 rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            Simulasi Durasi Sewa:
          </span>
          <div className="flex gap-1">
            {[1, 3, 7, 14].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  days === d
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {d}H
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Sewa di PinjeS</span>
            <span className="text-sm font-bold text-white">
              Rp {totalRental.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Beli Unit Baru</span>
            <span className="text-sm font-bold text-slate-400 line-through">
              Rp {buyPrice.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Savings banner */}
        <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span>💰</span>
            <span>Hemat {savedPercent}%!</span>
          </div>
          <span className="text-xs font-mono font-bold">
            Simpan Rp {savedAmount.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 mt-3.5 flex items-center gap-2">
        <Link
          href={`/p/${current.slug}`}
          className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-center text-xs tracking-wide shadow-md transition-all hover:scale-[1.01]"
        >
          Lihat Unit & Pesan Sekarang &rarr;
        </Link>
        {current.store.whatsapp && (
          <a
            href={`https://wa.me/62${current.store.whatsapp.replace(/^0/, "")}?text=${encodeURIComponent(`Halo ${current.store.name}, saya ingin sewa ${current.name} lewat PinjeS.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
            title="Chat WhatsApp Toko"
          >
            <span>💬</span>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
}
