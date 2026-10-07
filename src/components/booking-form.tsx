"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useCreateBooking } from "@/features/booking/hooks";
import { useAuth } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/animated-number";
import { eachDateKey, parseDateKey, toDateKey, todayKey } from "@/lib/dates";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  productId: string;
  pricePerDay: number;
  securityDeposit: number;
  minRentalDays?: number;
  maxRentalDays?: number;
}

type DayStatus = "available" | "booked" | "blocked" | "past";
interface CalendarDay {
  date: string;
  status: DayStatus;
}

const LOOKAHEAD_DAYS = 180;
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const addDays = (key: string, n: number) => toDateKey(new Date(parseDateKey(key).getTime() + n * 86_400_000));
const pad = (n: number) => String(n).padStart(2, "0");
const longDate = (key: string) =>
  parseDateKey(key).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = (key: string) =>
  parseDateKey(key).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function BookingForm({
  productId,
  pricePerDay,
  securityDeposit,
  minRentalDays = 1,
  maxRentalDays = 30,
}: BookingFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const createBooking = useCreateBooking();

  const [today] = useState(() => todayKey());
  const lastKey = addDays(today, LOOKAHEAD_DAYS);

  const [month, setMonth] = useState(() => ({
    y: Number(today.slice(0, 4)),
    m: Number(today.slice(5, 7)) - 1,
  }));

  const {
    data: calendarDays,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["product-calendar", productId, today, lastKey],
    queryFn: async () => {
      const qs = new URLSearchParams({ productId, from: today, to: lastKey });
      const res = await fetch(`/api/products/calendar?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memuat kalender");
      return json.data.days as CalendarDay[];
    },
    staleTime: 60_000,
  });

  const status = useMemo(() => {
    if (!calendarDays) return {};
    return Object.fromEntries(calendarDays.map((d) => [d.date, d.status]));
  }, [calendarDays]);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const pick = (key: string) => {
    if (status[key] !== "available") return;

    if (!start || end) {
      setStart(key);
      setEnd("");
      return;
    }
    if (key < start) {
      setStart(key);
      return;
    }

    const range = eachDateKey(start, key);
    if (range.some((d) => status[d] !== "available")) {
      toast.error("Ada tanggal di rentang itu yang sudah penuh. Pilih rentang lain.");
      setStart(key);
      setEnd("");
      return;
    }
    if (range.length < minRentalDays) {
      toast.error(`Minimal sewa ${minRentalDays} hari.`);
      return;
    }
    if (range.length > maxRentalDays) {
      toast.error(`Maksimal sewa ${maxRentalDays} hari.`);
      return;
    }
    setEnd(key);
  };

  const submit = () => {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu.");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      router.push(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (!start || !end) {
      toast.error("Pilih tanggal sewa terlebih dahulu.");
      return;
    }
    createBooking.mutate({
      productId,
      startDate: start,
      endDate: end,
      customerNote: customerNote.trim() || undefined,
    });
  };

  const days = start && end ? eachDateKey(start, end).length : 0;
  const lineTotal = days * pricePerDay;
  const total = days > 0 ? lineTotal + securityDeposit : 0;

  // Kisi kalender bulan yang sedang ditampilkan
  const firstWeekday = (new Date(Date.UTC(month.y, month.m, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month.y}-${pad(month.m + 1)}-${pad(i + 1)}`),
  ];
  const monthLabel = new Date(Date.UTC(month.y, month.m, 1)).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const firstMonthKey = today.slice(0, 7);
  const lastMonthKey = lastKey.slice(0, 7);
  const currentMonthKey = `${month.y}-${pad(month.m + 1)}`;

  const shiftMonth = (delta: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(Date.UTC(y, m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-canvas p-3 ring-1 ring-line ml:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={currentMonthKey <= firstMonthKey}
            aria-label="Bulan sebelumnya"
            className="grid size-10 place-items-center rounded-full bg-surface text-ink ring-1 ring-line transition hover:ring-ink disabled:opacity-30 disabled:hover:ring-line"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <p className="font-display text-base font-semibold capitalize tracking-tight text-ink" aria-live="polite">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={currentMonthKey >= lastMonthKey}
            aria-label="Bulan berikutnya"
            className="grid size-10 place-items-center rounded-full bg-surface text-ink ring-1 ring-line transition hover:ring-ink disabled:opacity-30 disabled:hover:ring-line"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        {isError ? (
          <div className="space-y-2 py-8 text-center text-sm text-muted">
            <p>Kalender ketersediaan gagal dimuat.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="font-semibold text-ink underline underline-offset-4"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 text-center text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>

            <div className={cn("mt-1 grid grid-cols-7 gap-y-1 transition-opacity", isLoading && "opacity-50")}>
              {cells.map((key, i) => {
                if (!key) return <span key={`blank-${i}`} />;

                const st = status[key];
                const available = !isLoading && !isError && st === "available";
                const isStart = key === start;
                const isEnd = key === end;
                const isEdge = isStart || isEnd;
                const inRange = Boolean(start && end && key > start && key < end);
                const isToday = key === today;

                // Garis latar yang menyambungkan tanggal awal sampai akhir
                const strip = inRange
                  ? "bg-brand-soft"
                  : isStart && end
                    ? "bg-linear-to-r from-transparent from-50% to-brand-soft to-50%"
                    : isEnd
                      ? "bg-linear-to-l from-transparent from-50% to-brand-soft to-50%"
                      : "";

                let cls = "text-muted/40";
                if (isEdge) cls = "bg-ink text-canvas";
                else if (inRange) cls = "text-brand";
                else if (available) cls = "text-ink hover:bg-surface hover:ring-1 hover:ring-ink";
                else if (st === "booked" || st === "blocked") cls = "text-muted/50 line-through";

                return (
                  <div key={key} className={cn("flex justify-center", strip)}>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => pick(key)}
                      aria-label={`${longDate(key)}${st === "booked" || st === "blocked" ? ", tidak tersedia" : ""}`}
                      aria-pressed={isEdge}
                      className={cn(
                        "aspect-square w-full max-w-11 rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
                        isToday && !isEdge && "ring-1 ring-signal",
                        cls,
                      )}
                    >
                      {Number(key.slice(8))}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Tanggal yang dicoret sudah penuh atau tidak tersedia. Minimal sewa {minRentalDays} hari, maksimal{" "}
          {maxRentalDays} hari.
        </p>
      </div>

      <div className="min-h-6 text-sm font-medium text-ink" aria-live="polite">
        {!start && <p className="text-muted">Pilih tanggal mulai sewa.</p>}
        {start && !end && <p>Mulai {shortDate(start)}. Sekarang pilih tanggal selesai.</p>}
        {start && end && (
          <p>
            {shortDate(start)} sampai {shortDate(end)} (<AnimatedNumber value={days} /> hari)
          </p>
        )}
      </div>

      <AnimatePresence>
        {days > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 overflow-hidden"
          >
            <div className="space-y-2.5 rounded-3xl bg-canvas p-4 text-sm text-muted ring-1 ring-line">
              <div className="flex justify-between gap-4">
                <span>
                  {formatRupiah(pricePerDay)} x <AnimatedNumber value={days} /> hari
                </span>
                <span className="text-ink">
                  <AnimatedNumber value={formatRupiah(lineTotal)} />
                </span>
              </div>
              {securityDeposit > 0 && (
                <div className="flex justify-between gap-4">
                  <span>Uang jaminan</span>
                  <span className="text-ink">{formatRupiah(securityDeposit)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3 text-ink">
                <span className="font-semibold">Total bayar</span>
                <AnimatedNumber
                  value={formatRupiah(total)}
                  className="font-display text-2xl font-bold tracking-tight"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="customer-note" className="text-xs font-semibold text-muted">
                Catatan untuk toko (opsional)
              </label>
              <textarea
                id="customer-note"
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Contoh: perkiraan jam ambil barang, permintaan khusus, dll."
                maxLength={500}
                className="w-full resize-none rounded-2xl border border-line bg-canvas p-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        variant="signal"
        className="h-14 w-full text-base"
        onClick={submit}
        disabled={createBooking.isPending || !start || !end || days <= 0}
      >
        {createBooking.isPending ? "Memproses..." : "Sewa sekarang"}
      </Button>
    </div>
  );
}
