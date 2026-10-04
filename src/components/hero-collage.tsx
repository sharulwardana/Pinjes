import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";
import type { ProductCardData } from "@/components/product-card";

// Posisi tiga kartu yang saling menumpuk. Rotasi ada di pembungkus luar,
// animasi melayang di pembungkus dalam, supaya transform keduanya tidak bentrok.
const SLOTS = [
  { box: "left-0 top-[8%] w-[54%] -rotate-6", delay: "0s" },
  { box: "right-0 top-0 w-[50%] rotate-5", delay: "1.4s" },
  { box: "left-[24%] bottom-0 w-[52%] -rotate-2", delay: "2.8s" },
];

export function HeroCollage({ products }: { products: ProductCardData[] }) {
  const items = products.filter((p) => p.photos[0]).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Contoh barang yang bisa disewa"
      className="relative mx-auto h-[26rem] w-full max-w-md ml:h-[30rem] lg:h-[36rem] lg:max-w-xl"
    >
      {items.map((p, i) => {
        const slot = SLOTS[i];
        return (
          <div key={p.id} className={cn("absolute", slot.box)}>
            <div className="animate-float" style={{ animationDelay: slot.delay }}>
              <Link
                href={`/p/${p.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[1.6rem] border-4 border-surface bg-line shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)]"
              >
                <ProductImage
                  path={p.photos[0]}
                  alt={p.name}
                  priority={i === 0}
                  className="size-full object-cover transition duration-700 ease-out-expo group-hover:scale-105"
                />
                <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-full bg-ink/85 px-3 py-1.5 text-[0.7rem] font-semibold text-canvas backdrop-blur">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-signal">{formatRupiah(p.pricePerDay)}</span>
                </span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
