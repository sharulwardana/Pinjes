import { route, readJson, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { createReviewSchema } from "@/features/reviews/schemas";

export const POST = route({ auth: true }, async ({ req, user }) => {
  const input = await readJson(req, createReviewSchema);

  return await db.$transaction(async (tx) => {
    // 1. Verify booking
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { items: true }
    });

    if (!booking) throw new AppError("Pesanan tidak ditemukan.", 404);
    if (booking.customerId !== user!.id) throw new AppError("Akses ditolak.", 403);
    if (booking.status !== "COMPLETED") throw new AppError("Pesanan belum selesai.", 400);

    const isProductInBooking = booking.items.some(i => i.productId === input.productId);
    if (!isProductInBooking) throw new AppError("Barang tidak ada di pesanan ini.", 400);

    // 2. Prevent duplicate reviews
    const existing = await tx.review.findUnique({
      where: { bookingId: booking.id } // Currently 1 review per booking. A real app might do per bookingItem.
    });

    if (existing) {
      throw new AppError("Anda sudah memberikan ulasan untuk pesanan ini.", 400);
    }

    // 3. Create review
    const review = await tx.review.create({
      data: {
        bookingId: booking.id,
        productId: input.productId,
        storeId: booking.storeId,
        customerId: user!.id,
        rating: input.rating,
        comment: input.comment,
        photoPath: input.photoPath,
      }
    });

    // 4. Denormalize rating to Product
    const agg = await tx.review.aggregate({
      where: { productId: input.productId },
      _count: true,
      _sum: { rating: true }
    });

    const newCount = (agg._count || 0);
    const newSum = (agg._sum.rating || 0);
    const newAvg = newCount > 0 ? newSum / newCount : 0;

    await tx.product.update({
      where: { id: input.productId },
      data: {
        ratingCount: newCount,
        ratingTotal: newSum,
        ratingAvg: newAvg,
      }
    });

    return ok(review, "Ulasan berhasil disimpan.");
  });
});
