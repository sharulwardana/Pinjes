import { ProductCard, type ProductCardData } from "@/components/product-card";

export function HomeProductFeed({ initialProducts }: { initialProducts: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {initialProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}