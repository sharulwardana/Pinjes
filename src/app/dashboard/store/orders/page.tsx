import Link from "next/link";
import { ArrowUpRight, CalendarDays, ImageOff, Inbox } from "lucide-react";
import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { ownStoreId } from "@/server/policies";
import { formatDateRange, formatRelative, formatRupiah } from "@/lib/format";
import { FINISHED_STATUSES, type BookingStatus } from "@/features/booking/status";
import { StatusPill } from "@/components/status-pill";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pesanan Masuk | PinjeS" };

/** Status yang menunggu tindakan toko. */
const ACTION_STATUSES: BookingStatus[] = ["PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "READY_FOR_PICKUP", "RETURNED"];

const ACTION_HINT: Partial<Record<BookingStatus, string>> = {
  PAYMENT_SUBMITTED: "Periksa bukti pembayaran",
  PAYMENT_CONFIRMED: "Siapkan barang",
  READY_FOR_PICKUP: "Serahkan saat pelanggan datang",
  RETURNED: "Selesaikan pesanan",
};

export default async function StoreOrdersPage() {
  const user = await requireRole(["STORE_OWNER"]);
  const storeId = ownStoreId(user);

  const bookings = await db.booking.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      items: {
        include: {
          product: { select: { images: { take: 1, orderBy: { sortOrder: "asc" }, select: { path: true } } } },
        },
      },
    },
  });

  const needAction = bookings.filter((b) => ACTION_STATUSES.includes(b.status));
  const running = bookings.filter((b) => !ACTION_STATUSES.includes(b.status) && !FINISHED_STATUSES.includes(b.status));
  const history = bookings.filter((b) => FINISHED_STATUSES.includes(b.status));

  type Row = (typeof bookings)[number];

  function OrderCard({ booking }: { booking: Row }) {
    const first = booking.items[0];
    const photo = first?.product.images[0]?.path;
    const more = booking.items.length - 1;
    const hint = ACTION_HINT[booking.status];

    return (
      <Link
        href={`/dashboard/store/orders/${booking.code}`}
        className={cn(
          "group flex gap-4 rounded-[1.75rem] p-3 ring-1 transition duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(0_0_0/0.3)] sm:p-4",
          hint ? "bg-surface ring-2 ring-signal" : "bg-surface ring-line",
        )}
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-line/60 sm:size-24">
          {photo ? (
            <ProductImage path={photo} alt={first?.productName ?? ""} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-muted">
              <ImageOff className="size-6" aria-label="Belum ada foto" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StatusPill status={booking.status} />
            <span className="text-xs font-semibold text-muted">#{booking.code}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold">
              {first?.productName ?? "Pesanan"}
              {more > 0 && <span className="font-normal text-muted"> +{more} barang</span>}
            </p>
            <p className="truncate text-sm text-muted">{booking.customer.name}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <CalendarDays className="size-4" aria-hidden />
              {formatDateRange(booking.startDate, booking.endDate, { short: true })}
            </span>
            <span className="font-display text-lg font-bold tabular-nums">{formatRupiah(booking.total)}</span>
          </div>

          {hint ? (
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
              {hint}
              <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </p>
          ) : (
            <p className="text-xs text-muted">Dibuat {formatRelative(booking.createdAt)}</p>
          )}
        </div>
      </Link>
    );
  }

  function Section({ title, count, rows }: { title: string; count: number; rows: Row[] }) {
    if (rows.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          {title}
          <span className="rounded-full bg-line/70 px-2.5 py-0.5 font-sans text-xs font-semibold text-muted">{count}</span>
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((b) => (
            <OrderCard key={b.id} booking={b} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-muted">Kelola toko</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">Pesanan masuk</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-[1.75rem] border border-dashed border-line px-6 py-24 text-center">
          <Inbox className="size-8 text-muted" aria-hidden />
          <p className="text-lg font-semibold">Belum ada pesanan</p>
          <p className="max-w-sm text-sm text-muted">Pesanan dari pelanggan akan muncul di sini begitu ada yang menyewa barangmu.</p>
        </div>
      ) : (
        <>
          <Section title="Perlu tindakan" count={needAction.length} rows={needAction} />
          <Section title="Sedang berjalan" count={running.length} rows={running} />
          <Section title="Riwayat" count={history.length} rows={history} />
        </>
      )}
    </div>
  );
}
