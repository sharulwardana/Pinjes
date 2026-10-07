import { route, readJson, ok } from "@/server/api";
import { createProductSchema } from "@/features/products/schemas";
import { createProduct } from "@/server/services/products";
import { db } from "@/server/db";

export const GET = route({ auth: true, roles: ["STORE_OWNER"] }, async ({ user }) => {
  if (!user!.storeId) {
    return ok({ items: [], total: 0 });
  }

  const items = await db.product.findMany({
    where: { storeId: user!.storeId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { sortOrder: "asc" } } }
  });

  return ok({
    items: items.map(item => ({
      ...item,
      photos: item.images.map(img => img.path),
    })),
    total: items.length
  });
});

export const POST = route({ auth: true, roles: ["STORE_OWNER"] }, async ({ req, user }) => {
  const input = await readJson(req, createProductSchema);
  const product = await createProduct(user!, user!.storeId!, input);
  return ok(product);
});
