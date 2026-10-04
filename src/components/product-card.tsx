import Link from "next/link";
import { ImageOff, MapPin, Star } from "lucide-react";
import { formatRupiah } from "@/lib/format";

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

export function ProductCard({ product }: { product: ProductCardData }) {
    const photo = product.photos[0];

    return (
        <Link
            href={`/p/${product.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
            <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={`/api/files/${photo}`}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageOff className="h-8 w-8" aria-label="Belum ada foto" />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                    {product.category && <p className="text-xs font-medium text-slate-500">{product.category.name}</p>}
                    <h3 className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-slate-900">{product.name}</h3>
                    <p className="mt-1 truncate text-sm text-slate-600">{product.store.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{product.store.city || "Lokasi belum diisi"}</span>
                    </p>

                    {(product.ratingCount > 0 || product.rentalCount > 0) && (
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                            {product.ratingCount > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                                    {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                                </span>
                            )}
                            {product.rentalCount > 0 && <span>Disewa {product.rentalCount}x</span>}
                        </p>
                    )}
                </div>

                <p className="mt-4 border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                    {formatRupiah(product.pricePerDay)}
                    <span className="text-xs font-normal text-slate-500"> / hari</span>
                </p>
            </div>
        </Link>
    );
}