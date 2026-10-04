"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
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
        className="flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-5 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.35)] transition duration-300 focus-within:border-ink focus-within:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.4)]"
      >
        <Search className="size-5 shrink-0 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mau sewa apa hari ini?"
          aria-label="Cari barang"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink placeholder:text-muted/70 focus:outline-none"
        />
        <Button type="submit" size="lg" className="shrink-0">
          Cari
          <ArrowRight aria-hidden />
        </Button>
      </form>

      <div className="mt-4 flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-muted">Sering dicari</span>
        <div className="hide-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4">
          {QUICK_SEARCHES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => go(label)}
              className="shrink-0 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition duration-300 hover:border-ink hover:bg-ink hover:text-canvas"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
