import Link from "next/link";
import { ArrowUpRight, ImageOff, MapPin, Star } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { ProductImage } from "@/components/product-image";

export interface ProductCardData {
    id: string;
    name: string;
    slug: string;
    pricePerDay: number;
    photos: string[];
    ratingAvg: number;
    ratingCount: number;
    rentalCount: number;
    store: { name: string; city: string };
    category?: { name: string } | null;
}

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
    const photo = product.photos[0];

    return (
        <Link
            href={`/p/${product.slug}`}
            className="group relative flex h-full flex-col rounded-[1.75rem] bg-surface p-2 ring-1 ring-line transition duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-[0_28px_56px_-28px_rgb(0_0_0/0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-line/60">
                {photo ? (
                    <ProductImage
                        path={photo}
                        alt={product.name}
                        priority={priority}
                        className="size-full object-cover transition duration-700 ease-out-expo group-hover:scale-[1.06]"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-muted">
                        <ImageOff className="size-8" aria-label="Belum ada foto" />
                    </div>
                )}

                {product.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-surface/85 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
                        {product.category.name}
                    </span>
                )}

                {product.ratingCount > 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                        {product.ratingAvg.toFixed(1)}
                        <span className="font-normal text-muted">({product.ratingCount})</span>
                    </span>
                )}

                <span className="absolute bottom-3 left-3 rounded-full bg-ink/90 px-3.5 py-1.5 text-sm font-semibold text-canvas backdrop-blur">
                    {formatRupiah(product.pricePerDay)}
                    <span className="text-xs font-normal text-canvas/70"> / hari</span>
                </span>
            </div>

            <div className="flex flex-1 items-end justify-between gap-3 px-3 pb-3 pt-4">
                <div className="min-w-0">
                    <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-ink">
                        {product.name}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">
                            {product.store.name}
                            {product.store.city ? ` · ${product.store.city}` : ""}
                        </span>
                    </p>
                    {product.rentalCount > 0 && (
                        <p className="mt-1 text-xs text-muted">Sudah disewa {product.rentalCount}x</p>
                    )}
                </div>

                <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas text-ink transition duration-500 ease-out-expo group-hover:rotate-45 group-hover:bg-signal"
                >
                    <ArrowUpRight className="size-5" />
                </span>
            </div>
        </Link>
    );
}
