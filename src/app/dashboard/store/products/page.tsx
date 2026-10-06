import Link from "next/link";
import { ImageOff, Plus, Star } from "lucide-react";
import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { ownStoreId } from "@/server/policies";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/lib/utils";

export const metadata = { title: "Daftar Barang | PinjeS" };

const PRODUCT_STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Aktif", className: "bg-brand-soft text-brand" },
  DRAFT: { label: "Draf", className: "bg-amber-100 text-amber-900" },
};

export default async function StoreProductsPage() {
  const user = await requireRole(["STORE_OWNER"]);
  const storeId = ownStoreId(user);

  const products = await db.product.findMany({
    where: { storeId, status: { not: "INACTIVE" }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" }, select: { path: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted">Kelola toko</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">Daftar barang</h1>
        </div>
        <Button asChild variant="brand">
          <Link href="/dashboard/store/products/new">
            <Plus aria-hidden /> Tambah barang
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-[1.75rem] border border-dashed border-line px-6 py-24 text-center">
          <p className="text-lg font-semibold">Belum ada barang</p>
          <p className="max-w-sm text-sm text-muted">Mulai sewakan barang yang jarang kamu pakai.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/store/products/new">Tambah barang pertamamu</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 xs:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const photo = product.images[0]?.path;
            const status = PRODUCT_STATUS[product.status] ?? { label: product.status, className: "bg-line/70 text-muted" };
            return (
              <li key={product.id}>
                <Link
                  href={`/p/${product.slug}`}
                  className="group flex h-full flex-col rounded-[1.75rem] bg-surface p-2 ring-1 ring-line transition duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-[0_28px_56px_-28px_rgb(0_0_0/0.3)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-line/60">
                    {photo ? (
                      <ProductImage
                        path={photo}
                        alt={product.name}
                        className="size-full object-cover transition duration-700 ease-out-expo group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-muted">
                        <ImageOff className="size-7" aria-label="Belum ada foto" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                    {product.stock <= 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-ink/90 px-3 py-1 text-xs font-semibold text-canvas">
                        Stok habis
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-3">
                    <p className="line-clamp-2 font-semibold leading-snug">{product.name}</p>
                    <p className="font-display text-xl font-bold tabular-nums">
                      {formatRupiah(product.pricePerDay)}
                      <span className="font-sans text-xs font-normal text-muted"> / hari</span>
                    </p>
                    <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
                      <div>
                        <dt className="text-muted">Stok</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">{product.stock}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Deposit</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">{formatRupiah(product.securityDeposit)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Ulasan</dt>
                        <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold tabular-nums">
                          <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                          {product.ratingCount > 0 ? product.ratingAvg.toFixed(1) : "–"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
