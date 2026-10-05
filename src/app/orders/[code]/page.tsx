import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Landmark, MapPin, MessageCircle, QrCode, XCircle } from "lucide-react";
import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { PaymentUploader } from "@/components/payment-uploader";
import { CancelOrderBtn } from "@/components/cancel-order-btn";
import { ReviewForm } from "@/components/review-form";
import { CopyButton } from "@/components/copy-button";
import { ProductImage } from "@/components/product-image";
import { StatusTimeline } from "@/components/status-timeline";
import { BOOKING_STATUS_META, type BookingStatus, type Tone } from "@/features/booking/status";
import { formatDateRange, formatDateTime, formatRupiah } from "@/lib/format";

const TONE_TO_VARIANT: Record<Tone, "outline" | "accent" | "success" | "warning" | "destructive" | "info"> = {
  neutral: "outline",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "info",
};

// 08123... -> 628123...
function whatsappLink(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

const card = "rounded-[1.75rem] bg-surface p-5 ring-1 ring-line md:rounded-[2rem] md:p-6";

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireRole(["CUSTOMER", "STORE_OWNER"]);
  const p = await params;

  const booking = await db.booking.findUnique({
    where: { code: p.code, customerId: user.id },
    include: {
      store: true,
      items: { include: { product: { select: { slug: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } },
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
  const firstItem = booking.items[0];

  const times = {
    PENDING_PAYMENT: formatDateTime(booking.createdAt),
    ...(booking.payment?.submittedAt ? { PAYMENT_SUBMITTED: formatDateTime(booking.payment.submittedAt) } : {}),
    ...(booking.confirmedAt ? { PAYMENT_CONFIRMED: formatDateTime(booking.confirmedAt) } : {}),
    ...(booking.readyAt ? { READY_FOR_PICKUP: formatDateTime(booking.readyAt) } : {}),
    ...(booking.pickedUpAt ? { RENTED: formatDateTime(booking.pickedUpAt) } : {}),
    ...(booking.returnedAt ? { RETURNED: formatDateTime(booking.returnedAt) } : {}),
    ...(booking.completedAt ? { COMPLETED: formatDateTime(booking.completedAt) } : {}),
  };

  return (
    <div className="shell pb-8 pt-4 md:pt-8">
      <Link
        href="/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Semua pesanan
      </Link>

      <header className="mb-8 md:mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={TONE_TO_VARIANT[meta.tone]}>{meta.label}</Badge>
          <span className="font-mono text-sm text-muted">#{booking.code}</span>
        </div>
        <h1 className="text-title mt-4 max-w-4xl text-ink">{firstItem?.productName ?? "Pesanan"}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{meta.description}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 2xl:grid-cols-[minmax(0,1fr)_28rem] 2xl:gap-14">
        {/* Kiri: tindakan, barang, jadwal */}
        <div className="space-y-6">
          {status === "PAYMENT_REJECTED" && (
            <div className="flex gap-3 rounded-3xl bg-red-50 p-5 text-sm text-red-900 ring-1 ring-red-200">
              <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="space-y-1">
                <p className="font-semibold">Bukti pembayaran ditolak</p>
                {booking.payment?.rejectionReason && <p>Alasan: {booking.payment.rejectionReason}</p>}
                <p>Unggah ulang bukti yang benar sebelum batas waktu di bawah.</p>
              </div>
            </div>
          )}

          {canPay && (
            <section className={`${card} space-y-6 ring-2 ring-signal`}>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Bayar langsung ke toko</h2>
                {booking.paymentDueAt && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    Batas waktu: <span className="font-semibold text-ink">{formatDateTime(booking.paymentDueAt)} WIB</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-canvas p-4 ring-1 ring-line">
                <div>
                  <p className="text-xs text-muted">Total yang dibayar</p>
                  <p className="font-display text-3xl font-bold tracking-tight text-ink">{formatRupiah(booking.total)}</p>
                </div>
                <CopyButton value={String(booking.total)} label="Salin jumlah" />
              </div>

              {hasBank && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-canvas p-4 ring-1 ring-line">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <Landmark className="size-4 shrink-0" aria-hidden />
                      {booking.store.bankName ? `${booking.store.bankName} ` : "Transfer "}
                      a.n {booking.store.bankAccountName || booking.store.name}
                    </p>
                    <p className="mt-1 break-all font-mono text-xl font-bold text-ink">{booking.store.bankAccountNumber}</p>
                  </div>
                  <CopyButton value={booking.store.bankAccountNumber ?? ""} label="Salin nomor" />
                </div>
              )}

              {hasQris && booking.store.qrisImagePath && (
                <div className="rounded-3xl bg-canvas p-4 ring-1 ring-line">
                  <p className="mb-3 flex items-center gap-2 text-sm text-muted">
                    <QrCode className="size-4 shrink-0" aria-hidden />
                    {hasBank ? "Atau bayar dengan QRIS" : "Bayar dengan QRIS"}
                  </p>
                  <div className="w-full max-w-[16rem] overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-line">
                    <ProductImage
                      path={booking.store.qrisImagePath}
                      alt={`QRIS ${booking.store.name}`}
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              )}

              {hasPaymentInfo ? (
                <PaymentUploader bookingId={booking.id} />
              ) : (
                <div className="space-y-3 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                  <p>Toko ini belum mengisi informasi pembayaran. Hubungi toko untuk menanyakan cara bayar.</p>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-amber-900 px-5 font-semibold text-amber-50 transition active:scale-95"
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      Hubungi toko lewat WhatsApp
                    </a>
                  )}
                </div>
              )}

              <div className="border-t border-line pt-5">
                <CancelOrderBtn bookingId={booking.id} />
              </div>
            </section>
          )}

          {status === "PAYMENT_SUBMITTED" && (
            <div className="flex gap-3 rounded-3xl bg-sky-50 p-5 text-sky-900 ring-1 ring-sky-200">
              <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">Pembayaran sedang diverifikasi</p>
                <p className="mt-1 text-sm">Pemilik toko sedang mengecek bukti transfer Anda. Harap tunggu.</p>
              </div>
            </div>
          )}

          {status === "CANCELLED" && (
            <div className="rounded-3xl bg-canvas p-5 text-sm text-ink ring-1 ring-line">
              <p className="font-semibold">Pesanan dibatalkan</p>
              {booking.cancelReason && <p className="mt-1 text-muted">Alasan: {booking.cancelReason}</p>}
            </div>
          )}

          {status === "COMPLETED" && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-3xl bg-green-50 p-5 text-green-900 ring-1 ring-green-200">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Sewa selesai</p>
                  <p className="mt-1 text-sm">
                    {booking.review
                      ? "Terima kasih, ulasanmu sudah tersimpan."
                      : "Pesanan ini telah selesai. Anda dapat memberikan ulasan untuk barang yang Anda sewa."}
                  </p>
                </div>
              </div>
              {!booking.review && booking.items[0] && (
                <ReviewForm bookingId={booking.id} productId={booking.items[0].productId} />
              )}
            </div>
          )}

          <section className={card}>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">Barang yang disewa</h2>
            <ul className="mt-4 divide-y divide-line">
              {booking.items.map((item) => {
                const photo = item.product.images[0]?.path;
                return (
                  <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-line/60">
                      {photo && <ProductImage path={photo} alt="" className="size-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/p/${item.product.slug}`}
                        className="block truncate font-display text-base font-semibold tracking-tight text-ink hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        {item.days} hari x {formatRupiah(item.pricePerDay)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-ink">{formatRupiah(item.lineTotal)}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={card}>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">Jadwal dan lokasi</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <dt className="text-muted">Tanggal sewa</dt>
                  <dd className="font-semibold text-ink">{formatDateRange(booking.startDate, booking.endDate)}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <dt className="text-muted">Ambil dan kembalikan di</dt>
                  <dd className="font-semibold text-ink">{booking.store.name}</dd>
                  {booking.store.address && <dd className="text-muted">{booking.store.address}</dd>}
                </div>
              </div>
            </dl>
          </section>
        </div>

        {/* Kanan: rincian dan perjalanan pesanan (menempel di layar lebar) */}
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className={card}>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">Rincian pembayaran</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal sewa</dt>
                <dd className="font-medium text-ink">{formatRupiah(booking.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Uang jaminan (dikembalikan)</dt>
                <dd className="font-medium text-ink">{formatRupiah(securityDepositTotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <dt className="font-semibold text-ink">Total bayar</dt>
                <dd className="font-display text-2xl font-bold tracking-tight text-ink">{formatRupiah(booking.total)}</dd>
              </div>
            </dl>
          </section>

          <section className={card}>
            <h2 className="mb-5 font-display text-xl font-bold tracking-tight text-ink">Perjalanan pesanan</h2>
            <StatusTimeline status={status} times={times} />
          </section>
        </aside>
      </div>
    </div>
  );
}
