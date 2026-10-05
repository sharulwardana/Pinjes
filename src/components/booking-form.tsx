"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCreateBooking } from "@/features/booking/hooks";
import { useAuth } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
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
  const [status, setStatus] = useState<Record<string, DayStatus>>({});
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ productId, from: today, to: lastKey });
    fetch(`/api/products/calendar?${qs.toString()}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        return json.data.days as CalendarDay[];
      })
      .then((days) => {
        if (cancelled) return;
        setStatus(Object.fromEntries(days.map((d) => [d.date, d.status])));
        setLoad("ready");
      })
      .catch(() => {
        if (!cancelled) setLoad("error");
      });
    return () => {
      cancelled = true;
    };
  }, [productId, today, lastKey, attempt]);

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
      router.push("/login");
      return;
    }
    if (!start || !end) {
      toast.error("Pilih tanggal sewa terlebih dahulu.");
      return;
    }
    createBooking.mutate({ productId, startDate: start, endDate: end });
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

        {load === "error" ? (
          <div className="space-y-2 py-8 text-center text-sm text-muted">
            <p>Kalender ketersediaan gagal dimuat.</p>
            <button
              type="button"
              onClick={() => {
                setLoad("loading");
                setAttempt((n) => n + 1);
              }}
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

            <div className={cn("mt-1 grid grid-cols-7 gap-y-1 transition-opacity", load === "loading" && "opacity-50")}>
              {cells.map((key, i) => {
                if (!key) return <span key={`blank-${i}`} />;

                const st = status[key];
                const available = load === "ready" && st === "available";
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
            {shortDate(start)} sampai {shortDate(end)} ({days} hari)
          </p>
        )}
      </div>

      {days > 0 && (
        <div className="space-y-2.5 rounded-3xl bg-canvas p-4 text-sm text-muted ring-1 ring-line">
          <div className="flex justify-between gap-4">
            <span>
              {formatRupiah(pricePerDay)} x {days} hari
            </span>
            <span className="text-ink">{formatRupiah(lineTotal)}</span>
          </div>
          {securityDeposit > 0 && (
            <div className="flex justify-between gap-4">
              <span>Uang jaminan</span>
              <span className="text-ink">{formatRupiah(securityDeposit)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3 text-ink">
            <span className="font-semibold">Total bayar</span>
            <span className="font-display text-2xl font-bold tracking-tight">{formatRupiah(total)}</span>
          </div>
        </div>
      )}

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
