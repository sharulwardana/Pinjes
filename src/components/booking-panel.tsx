"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, X } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { useIsDesktop } from "@/lib/use-is-desktop";
import { cn } from "@/lib/utils";

interface BookingPanelProps {
  pricePerDay: number;
  productName: string;
  /** Form pemesanan. Dirender SEKALI saja, jadi state tanggal tidak ganda. */
  children: ReactNode;
}

/**
 * Di layar >= 1024px: kartu biasa (menempel saat di-scroll, diatur oleh halaman).
 * Di bawah itu: bar harga di dasar layar yang membuka form sebagai bottom sheet.
 */
export function BookingPanel({ pricePerDay, productName, children }: BookingPanelProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const sheetOpen = open && !isDesktop;

  // Sheet terbuka: kunci scroll halaman dan tutup dengan Escape.
  useEffect(() => {
    if (!sheetOpen) return;
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
  }, [sheetOpen]);

  return (
    <>
      {/* Bar harga, hanya di bawah 1024px */}
      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-between gap-3 rounded-full border border-line bg-surface/90 py-2 pl-5 pr-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.35)] backdrop-blur-xl">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-none tracking-tight text-ink">
              {formatRupiah(pricePerDay)}
              <span className="text-xs font-normal text-muted"> / hari</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted">{productName}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            aria-controls="booking-sheet"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-canvas transition active:scale-95"
          >
            <CalendarDays className="size-4" aria-hidden />
            Pilih tanggal
          </button>
        </div>
      </div>

      {/* Latar gelap di belakang sheet */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-[65] bg-ink/50 backdrop-blur-sm transition-opacity duration-500 lg:hidden",
          sheetOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Satu-satunya salinan form: sheet di HP/tablet, kartu di desktop */}
      <div
        id="booking-sheet"
        role={isDesktop ? undefined : "dialog"}
        aria-modal={isDesktop ? undefined : true}
        aria-label="Pilih tanggal sewa"
        inert={!isDesktop && !open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-[2rem] bg-surface px-5 pt-3 shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.4)] transition-transform duration-500 ease-out-expo",
          "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
          open ? "translate-y-0" : "translate-y-full",
          "lg:static lg:z-auto lg:max-h-none lg:translate-y-0 lg:overflow-visible lg:rounded-[2rem] lg:border lg:border-line lg:p-6 lg:shadow-sm lg:transition-none",
        )}
      >
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line lg:hidden" />

        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Pilih tanggal sewa</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup"
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
