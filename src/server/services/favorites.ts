import { db } from "@/server/db";

export async function isProductFavorited(userId: string, productId: string): Promise<boolean> {
  const fav = await db.favorite.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });
  return Boolean(fav);
}

export async function toggleProductFavorite(
  userId: string,
  productId: string,
): Promise<{ favorited: boolean }> {
  const existing = await db.favorite.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    await db.favorite.delete({
      where: {
        userId_productId: { userId, productId },
      },
    });
    return { favorited: false };
  }

  await db.favorite.create({
    data: { userId, productId },
  });
  return { favorited: true };
}
