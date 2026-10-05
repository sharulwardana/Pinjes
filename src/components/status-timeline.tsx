import { Check, X } from "lucide-react";
import type { BookingStatus } from "@/features/booking/status";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "PENDING_PAYMENT", label: "Menunggu pembayaran" },
  { key: "PAYMENT_SUBMITTED", label: "Pembayaran diperiksa" },
  { key: "PAYMENT_CONFIRMED", label: "Pembayaran diterima" },
  { key: "READY_FOR_PICKUP", label: "Siap diambil" },
  { key: "RENTED", label: "Sedang disewa" },
  { key: "RETURNED", label: "Dikembalikan" },
  { key: "COMPLETED", label: "Selesai" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface StatusTimelineProps {
  status: BookingStatus;
  /** Waktu tiap tahap yang sudah lewat, sudah diformat (opsional). */
  times?: Partial<Record<StepKey, string>>;
}

/**
 * Perjalanan pesanan dari dibuat sampai selesai.
 * Pembayaran ditolak dianggap masih di tahap pertama (penyewa harus mengunggah ulang).
 * Pesanan dibatalkan tidak punya timeline, hanya satu penanda.
 */
export function StatusTimeline({ status, times }: StatusTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-canvas p-4 text-sm font-semibold text-ink ring-1 ring-line">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-canvas">
          <X className="size-4" aria-hidden />
        </span>
        Pesanan dibatalkan
      </div>
    );
  }

  const rejected = status === "PAYMENT_REJECTED";
  const currentKey: StepKey = rejected ? "PENDING_PAYMENT" : (status as StepKey);
  const currentIndex = STEPS.findIndex((s) => s.key === currentKey);

  return (
    <ol aria-label="Perjalanan pesanan">
      {STEPS.map((step, i) => {
        const done = i < currentIndex || (i === currentIndex && status === "COMPLETED");
        const current = i === currentIndex && !done;
        const last = i === STEPS.length - 1;
        const time = times?.[step.key];

        return (
          <li key={step.key} aria-current={current ? "step" : undefined} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn("absolute left-[0.9375rem] top-8 bottom-0 w-0.5", done ? "bg-brand" : "bg-line")}
              />
            )}

            <span
              aria-hidden
              className={cn(
                "relative grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                done && "bg-brand text-canvas",
                current && !rejected && "bg-signal text-ink ring-4 ring-signal/30",
                current && rejected && "bg-red-600 text-white ring-4 ring-red-600/20",
                !done && !current && "bg-canvas text-muted ring-1 ring-line",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>

            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "text-sm leading-tight",
                  done || current ? "font-semibold text-ink" : "text-muted",
                )}
              >
                {current && rejected ? "Pembayaran ditolak" : step.label}
              </p>
              {time && (done || current) && <p className="mt-1 text-xs text-muted">{time}</p>}
              {current && rejected && <p className="mt-1 text-xs text-red-700">Unggah ulang bukti pembayaran.</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
