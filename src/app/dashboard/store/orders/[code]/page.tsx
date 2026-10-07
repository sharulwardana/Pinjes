import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmPaymentBtn } from "@/components/confirm-payment-btn";
import { RejectPaymentBtn } from "@/components/reject-payment-btn";
import { StatusTransitionBtn } from "@/components/status-transition-btn";
import { BOOKING_STATUS_META, type BookingStatus, type Tone } from "@/features/booking/status";
import { formatDateTime, formatDateRange, formatRupiah } from "@/lib/format";

const TONE_TO_VARIANT: Record<Tone, "outline" | "accent" | "success" | "warning" | "destructive" | "info"> = {
  neutral: "outline",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "info",
};

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
  const meta = BOOKING_STATUS_META[status];
  const latestProof = booking.payment?.proofs[0];
  const isPdf = latestProof?.filePath.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href="/dashboard/store/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> Kembali ke daftar pesanan
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Pesanan #{booking.code}
            </h1>
            <Badge variant={TONE_TO_VARIANT[meta.tone]}>{meta.label}</Badge>
          </div>
          <span className="text-xs text-muted">Dibuat {formatDateTime(booking.createdAt)} WIB</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kolom Kiri: Informasi Pelanggan & Sewa */}
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">Informasi Pelanggan</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Nama Penyewa</dt>
                <dd className="font-semibold text-ink">{booking.customer.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Email</dt>
                <dd className="text-ink">{booking.customer.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">No. Telepon / WA</dt>
                <dd className="font-mono text-ink">{booking.customer.phone || "-"}</dd>
              </div>
            </dl>

            <h3 className="font-display text-base font-bold tracking-tight text-ink pt-4 border-t border-line">
              Jadwal & Barang
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Rentang Tanggal</span>
                <span className="font-semibold text-ink">
                  {formatDateRange(booking.startDate, booking.endDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Durasi Sewa</span>
                <span className="text-ink">{booking.days} Hari</span>
              </div>
            </div>

            <div className="pt-4 border-t border-line">
              <h4 className="text-xs font-semibold text-muted mb-2">Daftar Barang</h4>
              <ul className="divide-y divide-line">
                {booking.items.map((item) => (
                  <li key={item.id} className="py-2 first:pt-0 last:pb-0 flex justify-between text-sm">
                    <span className="font-medium text-ink">{item.productName}</span>
                    <span className="text-muted">
                      {item.days}h x {formatRupiah(item.pricePerDay)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {booking.customerNote && (
              <div className="pt-4 border-t border-line">
                <h4 className="text-xs font-semibold text-muted">Catatan Pelanggan:</h4>
                <p className="mt-1 text-sm text-ink bg-canvas p-3 rounded-2xl ring-1 ring-line">
                  {booking.customerNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Status & Verifikasi Pembayaran */}
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">Tindakan Pesanan</h2>

            {status === "PENDING_PAYMENT" && (
              <div className="rounded-2xl bg-canvas p-4 text-sm text-muted ring-1 ring-line">
                Menunggu pelanggan mentransfer pembayaran dan mengunggah bukti transfer.
              </div>
            )}

            {status === "PAYMENT_REJECTED" && (
              <div className="space-y-2 rounded-2xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200">
                <p className="font-semibold">Bukti pembayaran telah ditolak.</p>
                <p>Menunggu pelanggan mengunggah ulang bukti transfer yang benar.</p>
                {booking.payment?.rejectionReason && (
                  <p className="text-xs">
                    <span className="font-semibold">Alasan penolakan:</span> {booking.payment.rejectionReason}
                  </p>
                )}
              </div>
            )}

            {status === "PAYMENT_SUBMITTED" && latestProof && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-signal/20 p-4 text-sm text-ink ring-1 ring-signal/50">
                  <p className="font-semibold">Bukti transfer baru diunggah!</p>
                  <p className="mt-0.5 text-xs text-muted">Periksa kesesuaian dana di rekening atau mutasi QRIS Anda.</p>
                </div>

                {isPdf ? (
                  <a
                    href={`/api/files/${latestProof.filePath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-2xl bg-canvas p-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-surface transition"
                  >
                    <FileText className="size-5 text-brand" />
                    Buka Bukti Transfer (Dokumen PDF)
                  </a>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-line bg-canvas w-full max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${latestProof.filePath}`} alt="Bukti Transfer" className="w-full h-auto" />
                  </div>
                )}

                <dl className="rounded-2xl bg-canvas p-4 text-sm space-y-1.5 ring-1 ring-line">
                  <div className="flex justify-between">
                    <dt className="text-muted">Nama Pengirim</dt>
                    <dd className="font-semibold text-ink">{latestProof.senderName || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Total Pembayaran</dt>
                    <dd className="font-display text-base font-bold text-ink">{formatRupiah(booking.total)}</dd>
                  </div>
                  {booking.payment && booking.payment.proofs.length > 1 && (
                    <p className="text-xs text-muted pt-2 border-t border-line">
                      Unggahan ke-{booking.payment.proofs.length} dari pelanggan.
                    </p>
                  )}
                </dl>

                <div className="flex gap-2 pt-2">
                  <ConfirmPaymentBtn bookingId={booking.id} />
                  <RejectPaymentBtn bookingId={booking.id} />
                </div>
              </div>
            )}

            {status === "PAYMENT_CONFIRMED" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-brand-soft p-4 text-sm text-brand ring-1 ring-brand/20">
                  Pembayaran telah dikonfirmasi. Siapkan barang untuk diambil penyewa.
                </div>
                <StatusTransitionBtn bookingId={booking.id} nextStatus="READY_FOR_PICKUP" label="Tandai Barang Siap Diambil" />
              </div>
            )}

            {status === "READY_FOR_PICKUP" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-200">
                  Barang siap diambil di toko. Tunggu penyewa datang untuk serah terima unit.
                </div>
                <StatusTransitionBtn bookingId={booking.id} nextStatus="RENTED" label="Penyewa Sudah Mengambil Barang" />
              </div>
            )}

            {status === "RENTED" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-purple-50 p-4 text-sm text-purple-900 ring-1 ring-purple-200">
                  Barang sedang disewa oleh pelanggan hingga {formatDateTime(booking.endDate)}.
                </div>
                <StatusTransitionBtn bookingId={booking.id} nextStatus="RETURNED" label="Barang Sudah Dikembalikan" />
              </div>
            )}

            {status === "RETURNED" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                  Barang telah dikembalikan ke toko. Periksa kondisi kelengkapan unit sebelum menyelesaikan transaksi.
                </div>
                <StatusTransitionBtn bookingId={booking.id} nextStatus="COMPLETED" label="Selesaikan Pesanan & Kembalikan Jaminan" />
              </div>
            )}

            {status === "COMPLETED" && (
              <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-900 ring-1 ring-green-200">
                Pesanan ini telah selesai sepenuhnya. Uang jaminan diselesaikan sesuai kesepakatan.
              </div>
            )}

            {status === "CANCELLED" && (
              <div className="rounded-2xl bg-canvas p-4 text-sm text-muted ring-1 ring-line">
                Pesanan dibatalkan.
                {booking.cancelReason ? ` Alasan: ${booking.cancelReason}` : ""}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}