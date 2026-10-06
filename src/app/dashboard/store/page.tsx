import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowUpRight, Boxes, ClipboardList, Wallet } from "lucide-react";
import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { ownStoreId } from "@/server/policies";
import { getSettings } from "@/server/settings";
import { formatRupiah } from "@/lib/format";
import { SubmitStoreBtn } from "@/components/submit-store-btn";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const STORE_STATUS_TEXT: Record<string, string> = {
  DRAFT: "Tokomu masih berstatus draf.",
  PENDING_REVIEW: "Tokomu sedang ditinjau admin.",
  REJECTED: "Pengajuan tokomu ditolak.",
  SUSPENDED: "Tokomu sedang dinonaktifkan.",
};

function Alert({ children, urgent = false }: { children: React.ReactNode; urgent?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl p-4 text-sm ring-1",
        urgent ? "bg-signal/40 text-ink ring-signal" : "bg-amber-50 text-amber-950 ring-amber-200",
      )}
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  hint,
  href,
  children,
  highlight = false,
}: {
  icon: typeof Boxes;
  label: string;
  hint: string;
  href?: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "group flex h-full flex-col justify-between gap-6 rounded-[1.75rem] p-5 ring-1 transition duration-500 ease-out-expo",
        highlight ? "bg-brand text-accent-foreground ring-brand" : "bg-surface ring-line",
        href && "hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(0_0_0/0.35)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-full",
            highlight ? "bg-signal text-ink" : "bg-brand-soft text-brand",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        {href && <ArrowUpRight className="size-5 opacity-50 transition group-hover:opacity-100" aria-hidden />}
      </div>
      <div>
        <p className={cn("text-sm font-semibold", highlight ? "text-accent-foreground/80" : "text-muted")}>{label}</p>
        <p className="mt-1 font-display text-4xl font-bold tracking-tight tabular-nums">{children}</p>
        <p className={cn("mt-2 text-xs leading-relaxed", highlight ? "text-accent-foreground/70" : "text-muted")}>{hint}</p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-[1.75rem]">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function StoreDashboardPage() {
  const user = await requireRole(["STORE_OWNER"]);
  const storeId = ownStoreId(user);

  const [store, settings, activeOrdersCount, awaitingCheckCount, toHandleCount] = await Promise.all([
    db.store.findUnique({
      where: { id: storeId },
      include: { _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } } },
    }),
    getSettings(),
    db.booking.count({
      where: {
        storeId,
        status: { in: ["PENDING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "READY_FOR_PICKUP", "RENTED"] },
      },
    }),
    db.booking.count({ where: { storeId, status: "PAYMENT_SUBMITTED" } }),
    db.booking.count({ where: { storeId, status: { in: ["PAYMENT_CONFIRMED", "READY_FOR_PICKUP", "RETURNED"] } } }),
  ]);

  if (!store) notFound();

  const hasPaymentInfo = Boolean(store.bankAccountNumber) || Boolean(store.qrisImagePath);
  const balanceBlocksBookings = store.depositBalance <= settings.service_fee;
  const balanceLow = !balanceBlocksBookings && store.depositBalance <= settings.low_balance_threshold;
  const needAction = awaitingCheckCount + toHandleCount;

  return (
    <div className="space-y-8">
      <Reveal immediate y={16}>
        <p className="text-eyebrow text-muted">Ringkasan</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">{store.name}</h1>
      </Reveal>

      <div className="space-y-3">
        {store.status !== "ACTIVE" && (
          <Alert>
            <p className="font-semibold">{STORE_STATUS_TEXT[store.status] ?? "Tokomu belum aktif."}</p>
            <p className="mt-1">Selama belum aktif, barangmu tidak tampil di pencarian dan tidak bisa dipesan.</p>
            {store.rejectionReason && <p className="mt-1">Alasan: {store.rejectionReason}</p>}
            {(store.status === "DRAFT" || store.status === "REJECTED") && (
              <div className="mt-3 space-y-2">
                <p>Lengkapi alamat, WhatsApp, dan rekening atau QRIS di Pengaturan Toko, lalu ajukan.</p>
                <SubmitStoreBtn />
              </div>
            )}
          </Alert>
        )}

        {!hasPaymentInfo && (
          <Alert>
            <p className="font-semibold">Rekening atau QRIS belum diisi.</p>
            <p className="mt-1">
              Pelanggan tidak bisa membayar pesanan sampai kamu mengisinya.{" "}
              <Link href="/dashboard/store/settings" className="font-semibold underline underline-offset-4">
                Isi sekarang
              </Link>
            </p>
          </Alert>
        )}

        {balanceBlocksBookings && (
          <Alert>
            <p className="font-semibold">Saldo deposit tidak cukup untuk menerima pesanan baru.</p>
            <p className="mt-1">
              Biaya layanan {formatRupiah(settings.service_fee)} per pesanan harus lebih kecil dari saldo.{" "}
              <Link href="/dashboard/store/deposit" className="font-semibold underline underline-offset-4">
                Top-up deposit
              </Link>
            </p>
          </Alert>
        )}

        {balanceLow && (
          <Alert>
            <p className="font-semibold">Saldo deposit hampir habis.</p>
            <p className="mt-1">
              <Link href="/dashboard/store/deposit" className="font-semibold underline underline-offset-4">
                Top-up deposit
              </Link>{" "}
              supaya tokomu tetap bisa menerima pesanan.
            </p>
          </Alert>
        )}

        {awaitingCheckCount > 0 && (
          <Alert urgent>
            <p className="font-semibold">{awaitingCheckCount} bukti pembayaran menunggu kamu periksa.</p>
            <p className="mt-1">
              <Link href="/dashboard/store/orders" className="font-semibold underline underline-offset-4">
                Lihat pesanan
              </Link>
            </p>
          </Alert>
        )}
      </div>

      <Reveal delay={0.05} y={20}>
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={ClipboardList}
            label="Perlu tindakan"
            hint={needAction > 0 ? "Periksa bukti bayar, siapkan, atau selesaikan pesanan." : "Semua pesanan sudah ditangani."}
            href="/dashboard/store/orders"
            highlight={needAction > 0}
          >
            <CountUp value={needAction} />
          </Stat>
          <Stat icon={ClipboardList} label="Pesanan aktif" hint="Menunggu bayar sampai sedang disewa." href="/dashboard/store/orders">
            <CountUp value={activeOrdersCount} />
          </Stat>
          <Stat icon={Boxes} label="Barang aktif" hint="Tampil di pencarian dan bisa dipesan." href="/dashboard/store/products">
            <CountUp value={store._count.products} />
          </Stat>
          <Stat
            icon={Wallet}
            label="Saldo deposit"
            hint="Untuk biaya layanan. Bukan uang sewa dan tidak bisa ditarik."
            href="/dashboard/store/deposit"
          >
            Rp<CountUp value={store.depositBalance} />
          </Stat>
        </div>
      </Reveal>
    </div>
  );
}
