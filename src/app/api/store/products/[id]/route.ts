import { route, readJson, ok } from "@/server/api";
import { updateProductSchema } from "@/features/products/schemas";
import { updateProduct, deleteProduct } from "@/server/services/products";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";

export const GET = route({ auth: true, roles: ["STORE_OWNER"] }, async ({ params, user }) => {
  const { id } = await params;
  if (!user!.storeId) throw new AppError("Toko tidak ditemukan.", 404);

  const product = await db.product.findUnique({
    where: { id, storeId: user!.storeId, deletedAt: null },
    include: {
      category: { select: { slug: true, name: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) throw new AppError("Barang tidak ditemukan.", 404);

  return ok({
    ...product,
    category: product.category.slug,
    deposit: product.securityDeposit,
    photos: product.images.map((img) => img.path),
  });
});

export const PATCH = route({ auth: true, roles: ["STORE_OWNER"] }, async ({ req, params, user }) => {
  const { id } = await params;
  if (!user!.storeId) throw new AppError("Toko tidak ditemukan.", 404);

  const input = await readJson(req, updateProductSchema);
  const updated = await updateProduct(user!, user!.storeId, id, input);
  return ok(updated, "Barang berhasil diperbarui.");
});

export const DELETE = route({ auth: true, roles: ["STORE_OWNER"] }, async ({ params, user }) => {
  const { id } = await params;
  if (!user!.storeId) throw new AppError("Toko tidak ditemukan.", 404);

  await deleteProduct(user!, user!.storeId, id);
  return ok({}, "Barang berhasil dinonaktifkan.");
});
