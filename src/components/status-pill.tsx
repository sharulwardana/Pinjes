import { BOOKING_STATUS_META, type BookingStatus, type Tone } from "@/features/booking/status";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-line/70 text-muted",
  accent: "bg-brand-soft text-brand",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
};

/** Label status pesanan dengan warna sesuai tone di state machine. */
export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  const meta = BOOKING_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        TONE_CLASS[meta.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  );
}
