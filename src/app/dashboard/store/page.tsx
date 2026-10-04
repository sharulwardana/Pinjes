import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { ownStoreId } from "@/server/policies";
import { getSettings } from "@/server/settings";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STORE_STATUS_TEXT: Record<string, string> = {
  DRAFT: "Tokomu masih berstatus draf.",
  PENDING_REVIEW: "Tokomu sedang ditinjau admin.",
  REJECTED: "Pengajuan tokomu ditolak.",
  SUSPENDED: "Tokomu sedang dinonaktifkan.",
};

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">{children}</div>
  );
}

export default async function StoreDashboardPage() {
  const user = await requireRole(["STORE_OWNER"]);
  const storeId = ownStoreId(user);

  const [store, settings, activeOrdersCount, awaitingCheckCount] = await Promise.all([
    db.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: { products: { where: { status: "ACTIVE", deletedAt: null } } },
        },
      },
    }),
    getSettings(),
    db.booking.count({
      where: {
        storeId,
        status: { in: ["PENDING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "READY_FOR_PICKUP", "RENTED"] },
      },
    }),
    db.booking.count({ where: { storeId, status: "PAYMENT_SUBMITTED" } }),
  ]);

  if (!store) notFound();

  const hasPaymentInfo = Boolean(store.bankAccountNumber) || Boolean(store.qrisImagePath);
  const balanceBlocksBookings = store.depositBalance <= settings.service_fee;
  const balanceLow = !balanceBlocksBookings && store.depositBalance <= settings.low_balance_threshold;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Selamat datang di {store.name}</h1>

      <div className="space-y-3">
        {store.status !== "ACTIVE" && (
          <Alert>
            <p className="font-medium">{STORE_STATUS_TEXT[store.status] ?? "Tokomu belum aktif."}</p>
            <p className="mt-1">Selama belum aktif, barangmu tidak tampil di pencarian dan tidak bisa dipesan.</p>
            {store.rejectionReason && <p className="mt-1">Alasan: {store.rejectionReason}</p>}
          </Alert>
        )}

        {!hasPaymentInfo && (
          <Alert>
            <p className="font-medium">Rekening atau QRIS belum diisi.</p>
            <p className="mt-1">
              Pelanggan tidak bisa membayar pesanan sampai kamu mengisinya.{" "}
              <Link href="/dashboard/store/settings" className="font-medium underline">
                Isi sekarang
              </Link>
            </p>
          </Alert>
        )}

        {balanceBlocksBookings && (
          <Alert>
            <p className="font-medium">Saldo deposit tidak cukup untuk menerima pesanan baru.</p>
            <p className="mt-1">
              Biaya layanan {formatRupiah(settings.service_fee)} per pesanan harus lebih kecil dari saldo.{" "}
              <Link href="/dashboard/store/deposit" className="font-medium underline">
                Top-up deposit
              </Link>
            </p>
          </Alert>
        )}

        {balanceLow && (
          <Alert>
            <p className="font-medium">Saldo deposit hampir habis.</p>
            <p className="mt-1">
              <Link href="/dashboard/store/deposit" className="font-medium underline">
                Top-up deposit
              </Link>{" "}
              supaya tokomu tetap bisa menerima pesanan.
            </p>
          </Alert>
        )}

        {awaitingCheckCount > 0 && (
          <Alert>
            <p className="font-medium">{awaitingCheckCount} bukti pembayaran menunggu kamu periksa.</p>
            <p className="mt-1">
              <Link href="/dashboard/store/orders" className="font-medium underline">
                Lihat pesanan
              </Link>
            </p>
          </Alert>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total barang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store._count.products}</div>
            <p className="text-xs text-zinc-500">Barang aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrdersCount}</div>
            <p className="text-xs text-zinc-500">Menunggu dan sedang disewa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(store.depositBalance)}</div>
            <p className="text-xs text-zinc-500">
              Untuk biaya layanan. Bukan uang sewa dan tidak bisa ditarik.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}