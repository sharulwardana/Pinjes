import Link from "next/link";
import { ArrowUpRight, CalendarDays, PackageSearch } from "lucide-react";
import { requireRole } from "@/server/session";
import { getCustomerBookings } from "@/server/services/bookings";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/product-image";
import {
  BOOKING_STATUS_META,
  FINISHED_STATUSES,
  type BookingStatus,
  type Tone,
} from "@/features/booking/status";
import { formatDateRange, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type Booking = Awaited<ReturnType<typeof getCustomerBookings>>[number];

const TONE_TO_VARIANT: Record<Tone, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "accent"> = {
  neutral: "outline",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "info",
};

function OrderCard({ booking }: { booking: Booking }) {
  const status = booking.status as BookingStatus;
  const meta = BOOKING_STATUS_META[status];
  const needsAction = status === "PENDING_PAYMENT" || status === "PAYMENT_REJECTED";
  const firstItem = booking.items[0];
  const photo = firstItem?.product.images[0]?.path;
  const extra = booking.items.length - 1;

  return (
    <Link
      href={`/orders/${booking.code}`}
      className={cn(
        "group flex gap-4 rounded-[1.75rem] bg-surface p-3 ring-1 transition duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(0_0_0/0.3)] ml:gap-5 ml:p-4",
        needsAction ? "ring-2 ring-signal" : "ring-line",
      )}
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-line/60 ml:size-28 md:size-32">
        {photo && (
          <ProductImage
            path={photo}
            alt={firstItem?.productName ?? ""}
            className="size-full object-cover transition duration-700 ease-out-expo group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={TONE_TO_VARIANT[meta.tone]}>{meta.label}</Badge>
            <span className="font-mono text-xs text-muted">#{booking.code}</span>
          </div>

          <h2 className="mt-2 truncate font-display text-lg font-semibold tracking-tight text-ink">
            {firstItem?.productName ?? "Pesanan"}
            {extra > 0 && <span className="text-sm font-normal text-muted"> +{extra} barang</span>}
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted">{booking.store.name}</p>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {formatDateRange(booking.startDate, booking.endDate, { short: true })}
          </p>

          {status === "PAYMENT_REJECTED" && booking.payment?.rejectionReason && (
            <p className="mt-2 line-clamp-2 text-sm text-red-700">Ditolak: {booking.payment.rejectionReason}</p>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-xl font-bold tracking-tight text-ink">{formatRupiah(booking.total)}</p>
          <span
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
              needsAction ? "bg-signal text-ink" : "bg-canvas text-ink group-hover:bg-ink group-hover:text-canvas",
            )}
          >
            {status === "PAYMENT_REJECTED" ? "Unggah ulang" : needsAction ? "Bayar sekarang" : "Detail"}
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-4 flex items-center gap-3 font-display text-xl font-bold tracking-tight text-ink">
        {title}
        <span className="rounded-full bg-canvas px-2.5 py-0.5 font-sans text-xs font-semibold text-muted ring-1 ring-line">
          {count}
        </span>
      </h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,24rem),1fr))] md:gap-5">{children}</div>
    </section>
  );
}

export default async function CustomerOrdersPage() {
  const user = await requireRole(["CUSTOMER", "STORE_OWNER"]);
  const bookings = await getCustomerBookings(user);

  const history = bookings.filter((b) => FINISHED_STATUSES.includes(b.status as BookingStatus));
  const running = bookings.filter((b) => !FINISHED_STATUSES.includes(b.status as BookingStatus));

  return (
    <div className="shell space-y-10 pb-8 pt-4 md:space-y-12 md:pt-8">
      <header>
        <p className="text-eyebrow text-brand">Akun</p>
        <h1 className="text-title mt-3 text-ink">Pesanan saya</h1>
      </header>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center rounded-[2rem] border border-dashed border-line bg-surface/60 px-5 py-20 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
            <PackageSearch className="size-7" aria-hidden />
          </span>
          <p className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">Belum ada pesanan</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Kamu belum pernah menyewa barang. Cari yang kamu butuhkan, pilih tanggal, dan pesanannya akan muncul di sini.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-canvas transition hover:bg-ink/85 active:scale-95"
          >
            Jelajahi barang
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          {running.length > 0 && (
            <Section title="Sedang berjalan" count={running.length}>
              {running.map((b) => (
                <OrderCard key={b.id} booking={b} />
              ))}
            </Section>
          )}
          {history.length > 0 && (
            <Section title="Riwayat" count={history.length}>
              {history.map((b) => (
                <OrderCard key={b.id} booking={b} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}
