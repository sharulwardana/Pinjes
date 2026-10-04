"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_SEARCHES = ["Kamera", "Drone", "Tenda", "PlayStation", "Proyektor", "Speaker"];

export function LocationSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const go = (value: string) => {
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <div className="w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
        className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900"
      >
        <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mau sewa apa? Contoh: kamera, tenda, drone"
          aria-label="Cari barang"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <Button type="submit" className="h-11 rounded-xl px-5 text-sm font-semibold">
          Cari
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Sering dicari:</span>
        {QUICK_SEARCHES.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => go(label)}
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}