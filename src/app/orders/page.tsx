import { requireRole } from "@/server/session";
import { getCustomerBookings } from "@/server/services/bookings";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_META, type BookingStatus } from "@/features/booking/status";

const formatDate = (d: Date) => d.toLocaleDateString("id-ID", { timeZone: "UTC" });

export default async function CustomerOrdersPage() {
  const user = await requireRole(["CUSTOMER", "STORE_OWNER"]);
  const bookings = await getCustomerBookings(user);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pesanan Saya</h1>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-32 text-center">
          <p className="text-lg font-medium text-zinc-900">Belum ada pesanan</p>
          <p className="mt-1 text-sm text-zinc-500">Kamu belum pernah menyewa barang.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = booking.status as BookingStatus;
            const needsAction = status === "PENDING_PAYMENT" || status === "PAYMENT_REJECTED";
            return (
              <div
                key={booking.id}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-lg">{booking.store.name}</h3>
                    <Badge variant={needsAction ? "destructive" : "default"}>
                      {BOOKING_STATUS_META[status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </p>
                  <div className="pt-2">
                    {booking.items.map((item) => (
                      <div key={item.id} className="text-sm font-medium text-zinc-900">
                        {item.productName}
                      </div>
                    ))}
                  </div>
                  {status === "PAYMENT_REJECTED" && booking.payment?.rejectionReason && (
                    <p className="text-sm text-red-700">
                      Alasan penolakan: {booking.payment.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between min-w-32">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Total Bayar</p>
                    <p className="font-bold text-lg text-zinc-900">
                      Rp {booking.total.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Link
                    href={`/orders/${booking.code}`}
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90"
                  >
                    {status === "PAYMENT_REJECTED" ? "Unggah ulang bukti" : "Detail Pesanan"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}