import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ConfirmPaymentBtn } from "@/components/confirm-payment-btn";
import { RejectPaymentBtn } from "@/components/reject-payment-btn";
import { StatusTransitionBtn } from "@/components/status-transition-btn";
import { BOOKING_STATUS_META, type BookingStatus } from "@/features/booking/status";

export default async function StoreOrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireRole(["STORE_OWNER"]);
  const p = await params;

  const booking = await db.booking.findUnique({
    where: { code: p.code, store: { ownerId: user.id } },
    include: {
      customer: true,
      items: true,
      payment: { include: { proofs: { orderBy: { createdAt: "desc" } } } },
    },
  });

  if (!booking) notFound();

  const status = booking.status as BookingStatus;
  const latestProof = booking.payment?.proofs[0];
  const isPdf = latestProof?.filePath.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pesanan #{booking.code}</h1>
        <Badge variant={status === "PENDING_PAYMENT" || status === "PAYMENT_REJECTED" ? "destructive" : "default"}>
          {BOOKING_STATUS_META[status].label}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-zinc-900">Informasi Pelanggan</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-zinc-500">Nama:</span> {booking.customer.name}</p>
            <p><span className="text-zinc-500">Email:</span> {booking.customer.email}</p>
            <p><span className="text-zinc-500">No HP:</span> {booking.customer.phone || "-"}</p>
          </div>

          <h3 className="font-semibold text-zinc-900 mt-6 pt-4 border-t border-zinc-100">Jadwal Sewa</h3>
          <div className="text-sm">
            <p>
              {booking.startDate.toLocaleDateString("id-ID", { timeZone: "UTC" })} -{" "}
              {booking.endDate.toLocaleDateString("id-ID", { timeZone: "UTC" })}
            </p>
            <p className="text-zinc-500">({booking.days} Hari)</p>
          </div>

          {booking.customerNote && (
            <>
              <h3 className="font-semibold text-zinc-900 mt-6 pt-4 border-t border-zinc-100">Catatan Pelanggan</h3>
              <p className="text-sm text-zinc-700">{booking.customerNote}</p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-zinc-900">Pembayaran</h3>

          {status === "PENDING_PAYMENT" && (
            <div className="text-sm text-zinc-500">Menunggu pembayaran dari pelanggan.</div>
          )}

          {status === "PAYMENT_REJECTED" && (
            <div className="space-y-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <p>Bukti pembayaran ditolak. Menunggu pelanggan mengunggah ulang.</p>
              {booking.payment?.rejectionReason && (
                <p>
                  <span className="font-medium">Alasan:</span> {booking.payment.rejectionReason}
                </p>
              )}
            </div>
          )}

          {status === "PAYMENT_SUBMITTED" && latestProof && (
            <div className="space-y-4">
              {isPdf ? (
                <a
                  href={`/api/files/${latestProof.filePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-medium text-blue-700 underline"
                >
                  Buka bukti transfer (PDF)
                </a>
              ) : (
                <div className="rounded-lg border border-zinc-200 overflow-hidden w-full max-w-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/files/${latestProof.filePath}`} alt="Bukti Transfer" className="w-full h-auto" />
                </div>
              )}
              <div className="text-sm">
                <p><span className="text-zinc-500">Pengirim:</span> {latestProof.senderName || "-"}</p>
                <p><span className="text-zinc-500">Jumlah Seharusnya:</span> Rp {booking.total.toLocaleString("id-ID")}</p>
                {booking.payment && booking.payment.proofs.length > 1 && (
                  <p className="text-zinc-500">Unggahan ke-{booking.payment.proofs.length} dari pelanggan.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <ConfirmPaymentBtn bookingId={booking.id} />
                <RejectPaymentBtn bookingId={booking.id} />
              </div>
            </div>
          )}

          {status === "PAYMENT_CONFIRMED" && (
            <div className="space-y-4">
              <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                Pembayaran telah dikonfirmasi. Siapkan barang untuk pelanggan.
              </div>
              <StatusTransitionBtn bookingId={booking.id} nextStatus="READY_FOR_PICKUP" label="Tandai Barang Siap Diambil" />
            </div>
          )}

          {status === "READY_FOR_PICKUP" && (
            <div className="space-y-4">
              <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md">
                Barang sudah siap. Tunggu pelanggan mengambilnya.
              </div>
              <StatusTransitionBtn bookingId={booking.id} nextStatus="RENTED" label="Pelanggan Sudah Mengambil Barang" />
            </div>
          )}

          {status === "RENTED" && (
            <div className="space-y-4">
              <div className="text-sm text-purple-700 bg-purple-50 p-3 rounded-md">
                Barang sedang disewa oleh pelanggan.
              </div>
              <StatusTransitionBtn bookingId={booking.id} nextStatus="RETURNED" label="Barang Sudah Dikembalikan" />
            </div>
          )}

          {status === "RETURNED" && (
            <div className="space-y-4">
              <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md">
                Barang telah dikembalikan. Harap cek kondisi barang.
              </div>
              <StatusTransitionBtn bookingId={booking.id} nextStatus="COMPLETED" label="Selesaikan Pesanan" />
            </div>
          )}

          {status === "COMPLETED" && (
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
              Pesanan ini telah selesai.
            </div>
          )}

          {status === "CANCELLED" && (
            <div className="text-sm text-zinc-700 bg-zinc-100 p-3 rounded-md">
              Pesanan ini dibatalkan.
              {booking.cancelReason ? ` Alasan: ${booking.cancelReason}` : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}