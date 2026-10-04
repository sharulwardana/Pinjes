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
    setLoad("loading");
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
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={currentMonthKey <= firstMonthKey}
            aria-label="Bulan sebelumnya"
            className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <p className="text-sm font-semibold capitalize text-slate-900" aria-live="polite">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={currentMonthKey >= lastMonthKey}
            aria-label="Bulan berikutnya"
            className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {load === "error" ? (
          <div className="space-y-2 py-6 text-center text-sm text-slate-600">
            <p>Kalender ketersediaan gagal dimuat.</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="font-medium text-slate-900 underline"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className={`mt-1 grid grid-cols-7 gap-1 ${load === "loading" ? "opacity-50" : ""}`}>
              {cells.map((key, i) => {
                if (!key) return <span key={`blank-${i}`} />;

                const st = status[key];
                const available = load === "ready" && st === "available";
                const isEdge = key === start || key === end;
                const inRange = Boolean(start && end && key > start && key < end);

                let cls = "text-slate-300";
                if (isEdge) cls = "bg-slate-900 text-white";
                else if (inRange) cls = "bg-slate-200 text-slate-900";
                else if (available) cls = "text-slate-900 hover:bg-slate-100";
                else if (st === "booked" || st === "blocked") cls = "text-slate-400 line-through";

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!available}
                    onClick={() => pick(key)}
                    aria-label={`${longDate(key)}${st === "booked" || st === "blocked" ? ", tidak tersedia" : ""}`}
                    aria-pressed={isEdge}
                    className={`aspect-square rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${cls}`}
                  >
                    {Number(key.slice(8))}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-3 text-xs text-slate-500">
          Tanggal yang dicoret sudah penuh atau tidak tersedia. Minimal sewa {minRentalDays} hari, maksimal{" "}
          {maxRentalDays} hari.
        </p>
      </div>

      <div className="text-sm text-slate-700" aria-live="polite">
        {!start && <p>Pilih tanggal mulai sewa.</p>}
        {start && !end && <p>Mulai {shortDate(start)}. Sekarang pilih tanggal selesai.</p>}
        {start && end && (
          <p>
            {shortDate(start)} sampai {shortDate(end)} ({days} hari)
          </p>
        )}
      </div>

      {days > 0 && (
        <div className="space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>
              {formatRupiah(pricePerDay)} x {days} hari
            </span>
            <span>{formatRupiah(lineTotal)}</span>
          </div>
          {securityDeposit > 0 && (
            <div className="flex justify-between">
              <span>Uang jaminan</span>
              <span>{formatRupiah(securityDeposit)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-2 text-lg font-bold text-slate-900">
            <span>Total bayar</span>
            <span>{formatRupiah(total)}</span>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="w-full text-base font-semibold"
        onClick={submit}
        disabled={createBooking.isPending || !start || !end || days <= 0}
      >
        {createBooking.isPending ? "Memproses..." : "Sewa sekarang"}
      </Button>
    </div>
  );
}