import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PaymentUploader } from "@/components/payment-uploader";
import { CancelOrderBtn } from "@/components/cancel-order-btn";
import { ReviewForm } from "@/components/review-form";
import { BOOKING_STATUS_META, type BookingStatus } from "@/features/booking/status";

const formatDate = (d: Date) => d.toLocaleDateString("id-ID", { timeZone: "UTC" });
const formatDateTime = (d: Date) =>
  d.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });

// 08123... -> 628123...
function whatsappLink(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireRole(["CUSTOMER", "STORE_OWNER"]);
  const p = await params;

  const booking = await db.booking.findUnique({
    where: { code: p.code, customerId: user.id },
    include: {
      store: true,
      items: true,
      payment: true,
      review: { select: { id: true } },
    },
  });

  if (!booking) notFound();

  const status = booking.status as BookingStatus;
  const meta = BOOKING_STATUS_META[status];
  const canPay = status === "PENDING_PAYMENT" || status === "PAYMENT_REJECTED";
  const hasBank = Boolean(booking.store.bankAccountNumber);
  const hasQris = Boolean(booking.store.qrisImagePath);
  const hasPaymentInfo = hasBank || hasQris;
  const waLink = whatsappLink(booking.store.whatsapp || booking.store.phone);
  const securityDepositTotal = booking.items.reduce((acc, item) => acc + item.securityDeposit, 0);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pesanan #{booking.code}</h1>
        <Badge variant={canPay ? "destructive" : "default"}>{meta.label}</Badge>
      </div>

      <p className="text-sm text-zinc-600">{meta.description}</p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-zinc-900 mb-2">Detail Barang</h3>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4">
              {booking.items.map((item) => (
                <div key={item.id}>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-zinc-500">
                    {item.days} hari x Rp {item.pricePerDay.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-2">Jadwal Sewa</h3>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="font-medium text-zinc-900">
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
              </p>
              <p className="text-sm text-zinc-500">Ambil &amp; kembali di: {booking.store.name}</p>
              {booking.store.address && <p className="text-sm text-zinc-500">{booking.store.address}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-zinc-900 mb-2">Rincian Pembayaran</h3>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal Sewa</span>
                <span className="font-medium text-zinc-900">Rp {booking.subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Deposit Jaminan (Dikembalikan)</span>
                <span className="font-medium text-zinc-900">Rp {securityDepositTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-100 font-bold text-lg text-zinc-900">
                <span>Total Bayar</span>
                <span>Rp {booking.total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {status === "PAYMENT_REJECTED" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-1">
              <p className="font-medium">Bukti pembayaran ditolak</p>
              {booking.payment?.rejectionReason && <p>Alasan: {booking.payment.rejectionReason}</p>}
              <p>Unggah ulang bukti yang benar sebelum batas waktu di bawah.</p>
            </div>
          )}

          {canPay && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4">
              <h3 className="font-semibold text-zinc-900">Bayar langsung ke toko</h3>

              {booking.paymentDueAt && (
                <p className="text-sm text-zinc-600">Batas waktu: {formatDateTime(booking.paymentDueAt)} WIB</p>
              )}

              {hasBank && (
                <div>
                  <p className="text-sm text-zinc-600">
                    {booking.store.bankName ? `${booking.store.bankName} ` : "Transfer "}
                    a.n {booking.store.bankAccountName || booking.store.name}
                  </p>
                  <p className="text-xl font-bold font-mono mt-1 text-zinc-900">
                    {booking.store.bankAccountNumber}
                  </p>
                </div>
              )}

              {hasQris && (
                <div>
                  <p className="text-sm text-zinc-600 mb-2">Atau bayar dengan QRIS:</p>
                  <div className="w-full max-w-[220px] overflow-hidden rounded-lg border border-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/files/${booking.store.qrisImagePath}`}
                      alt={`QRIS ${booking.store.name}`}
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              )}

              {hasPaymentInfo ? (
                <PaymentUploader bookingId={booking.id} />
              ) : (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 space-y-2">
                  <p>Toko ini belum mengisi informasi pembayaran. Hubungi toko untuk menanyakan cara bayar.</p>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block font-medium underline"
                    >
                      Hubungi toko lewat WhatsApp
                    </a>
                  )}
                </div>
              )}

              <div className="border-t border-zinc-100 pt-4">
                <CancelOrderBtn bookingId={booking.id} />
              </div>
            </div>
          )}

          {status === "PAYMENT_SUBMITTED" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
              <p className="font-medium">Pembayaran Sedang Diverifikasi</p>
              <p className="text-sm mt-1">Pemilik toko sedang mengecek bukti transfer Anda. Harap tunggu.</p>
            </div>
          )}

          {status === "CANCELLED" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p className="font-medium">Pesanan dibatalkan</p>
              {booking.cancelReason && <p className="mt-1">Alasan: {booking.cancelReason}</p>}
            </div>
          )}

          {status === "COMPLETED" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                <p className="font-medium">Sewa Selesai</p>
                <p className="text-sm mt-1">
                  {booking.review
                    ? "Terima kasih, ulasanmu sudah tersimpan."
                    : "Pesanan ini telah selesai. Anda dapat memberikan ulasan untuk barang yang Anda sewa."}
                </p>
              </div>
              {!booking.review && booking.items[0] && (
                <ReviewForm bookingId={booking.id} productId={booking.items[0].productId} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}