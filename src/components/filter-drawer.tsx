"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useIsDesktop } from "@/lib/use-is-desktop";
import { cn } from "@/lib/utils";

interface FilterDrawerProps {
  /** Jumlah filter yang sedang aktif, ditampilkan di tombol. */
  activeCount: number;
  /** Form filter. Dirender SEKALI saja: laci di HP/tablet, sidebar di desktop. */
  children: ReactNode;
}

export function FilterDrawer({ activeCount, children }: FilterDrawerProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const drawerOpen = open && !isDesktop;

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Tombol mengambang di atas bottom navigation, hanya di bawah 1024px */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls="filter-drawer"
          className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-canvas shadow-[0_16px_40px_-12px_rgb(0_0_0/0.5)] transition active:scale-95"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filter
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-signal text-xs font-bold text-ink">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-[65] bg-ink/50 backdrop-blur-sm transition-opacity duration-500 lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        id="filter-drawer"
        role={isDesktop ? undefined : "dialog"}
        aria-modal={isDesktop ? undefined : true}
        aria-label="Filter pencarian"
        inert={!isDesktop && !open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-[2rem] bg-surface px-5 pt-3 shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.4)] transition-transform duration-500 ease-out-expo",
          "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
          open ? "translate-y-0" : "translate-y-full",
          "lg:static lg:z-auto lg:max-h-none lg:translate-y-0 lg:overflow-visible lg:rounded-[2rem] lg:border lg:border-line lg:p-6 lg:shadow-none lg:transition-none",
        )}
      >
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line lg:hidden" />

        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Filter</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup filter"
            className="grid size-10 place-items-center rounded-full bg-canvas text-ink transition active:scale-95 lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {children}
      </div>
    </>
  );
}
