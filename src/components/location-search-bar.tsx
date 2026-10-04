"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LocationSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState("5km");
  const [isLocating, setIsLocating] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{
    text: string;
    coords?: string;
    isLocked: boolean;
  }>({
    text: "Deteksi GPS Terdekat",
    isLocked: false,
  });

  const handleSearch = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = customQuery !== undefined ? customQuery : query;
    const params = new URLSearchParams();
    if (finalQuery.trim()) params.set("q", finalQuery.trim());
    if (locationInfo.isLocked) params.set("near", "me");
    if (radius !== "all") params.set("radius", radius);

    router.push(`/search?${params.toString()}`);
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationInfo({ text: "Menghubungkan radar GPS...", isLocked: false });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          setTimeout(() => {
            setLocationInfo({
              text: "Jakarta Selatan (Radius 5 km)",
              coords: `${lat}, ${lng}`,
              isLocked: true,
            });
            setIsLocating(false);
          }, 800);
        },
        () => {
          // Graceful simulated fallback for demo/desktop
          setTimeout(() => {
            setLocationInfo({
              text: "Jakarta Selatan (Auto-Detect)",
              coords: "-6.2615, 106.8106",
              isLocked: true,
            });
            setIsLocating(false);
          }, 800);
        },
        { timeout: 5000 }
      );
    } else {
      setLocationInfo({
        text: "Jakarta Selatan (Default)",
        coords: "-6.2615, 106.8106",
        isLocked: true,
      });
      setIsLocating(false);
    }
  };

  const quickCategories = [
    { label: "📸 Kamera & Lens", query: "kamera" },
    { label: "🛸 Drone 4K", query: "drone" },
    { label: "⛺ Tenda Camping", query: "tenda" },
    { label: "🎮 PS5 & Switch", query: "playstation" },
    { label: "🛵 Honda Scoopy", query: "scoopy" },
    { label: "🔊 Sound System", query: "sound" },
  ];

  return (
    <div className="w-full max-w-2xl text-left">
      {/* Search Input Container */}
      <div className="relative rounded-2xl bg-white p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-900/10 transition-all focus-within:ring-2 focus-within:ring-blue-600 focus-within:shadow-[0_12px_40px_rgba(37,99,235,0.12)]">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 flex items-center px-3 py-1">
            <svg
              className="w-5 h-5 text-slate-400 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mau pinjam apa hari ini? (Kamera, Tenda, Drone...)"
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-base font-medium"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:border-l sm:pl-3">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                locationInfo.isLocked
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Gunakan titik koordinat terdekat"
            >
              <span className={`inline-block h-2 w-2 rounded-full ${
                locationInfo.isLocked ? "bg-emerald-500 animate-pulse" : isLocating ? "bg-amber-500 animate-ping" : "bg-slate-400"
              }`} />
              <span className="truncate max-w-32.5 sm:max-w-37.5">
                {isLocating ? "Memindai..." : locationInfo.isLocked ? "📍 " + locationInfo.text : "📍 " + locationInfo.text}
              </span>
            </button>

            <Button
              type="submit"
              className="rounded-xl px-5 h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              Cari Sekarang
            </Button>
          </div>
        </form>

        {/* Radius Filter Pills */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="font-semibold text-slate-700">Radius Jarak:</span>
            {[
              { id: "2km", label: "< 2 km" },
              { id: "5km", label: "< 5 km" },
              { id: "10km", label: "< 10 km" },
              { id: "all", label: "Seluruh Kota" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRadius(r.id)}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  radius === r.id
                    ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {locationInfo.coords && (
            <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              GPS: {locationInfo.coords}
            </span>
          )}
        </div>
      </div>

      {/* Quick Search Chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Sering Dicari:
        </span>
        {quickCategories.map((cat) => (
          <button
            key={cat.query}
            type="button"
            onClick={() => {
              setQuery(cat.query);
              handleSearch(undefined, cat.query);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
