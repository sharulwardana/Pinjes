import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Reveal } from "@/components/motion/reveal";

/**
 * Grid otomatis: jumlah kolom menyesuaikan lebar layar (1 kolom di Mobile S,
 * 6+ kolom di 4K) tanpa perlu breakpoint tambahan.
 */
export function HomeProductFeed({ initialProducts }: { initialProducts: ProductCardData[] }) {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,16.5rem),1fr))] md:gap-6">
      {initialProducts.map((product, i) => (
        <Reveal key={product.id} delay={(i % 4) * 0.06} y={20} className="h-full">
          <ProductCard product={product} priority={i < 2} />
        </Reveal>
      ))}
    </div>
  );
}
