import { route, readJson, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { z } from "zod";

export const POST = route({ auth: true }, async ({ req, user }) => {
  const { bookingId } = await readJson(req, z.object({ bookingId: z.string().min(1) }));

  return await db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, store: { select: { ownerId: true } } },
    });

    if (!booking) throw new AppError("Pesanan tidak ditemukan.", 404);
    if (booking.store.ownerId !== user!.id) throw new AppError("Akses ditolak.", 403);

    if (!booking.payment || booking.status !== "PAYMENT_SUBMITTED") {
      throw new AppError("Pesanan belum dibayar atau sudah diproses.", 400);
    }

    const fee = booking.platformFee;

    // Potong saldo hanya jika cukup. Hasil update dipakai untuk ledger.
    let updatedStore;
    try {
      updatedStore = await tx.store.update({
        where: { id: booking.storeId, depositBalance: { gte: fee } },
        data: { depositBalance: { decrement: fee }, lockVersion: { increment: 1 } },
        select: { depositBalance: true },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2025") {
        throw new AppError(
          "Saldo deposit toko tidak cukup untuk mengonfirmasi pesanan ini. Silakan top-up terlebih dahulu.",
          400,
        );
      }
      throw e;
    }

    await tx.depositTransaction.create({
      data: {
        storeId: booking.storeId,
        type: "SERVICE_FEE",
        amount: -fee,
        balanceBefore: updatedStore.depositBalance + fee,
        balanceAfter: updatedStore.depositBalance,
        referenceType: "BOOKING",
        referenceId: booking.id,
        description: `Potongan biaya layanan untuk pesanan ${booking.code}`,
        createdById: user!.id,
      },
    });

    const now = new Date();
    await tx.payment.update({
      where: { id: booking.payment.id },
      data: { status: "CONFIRMED", confirmedAt: now, confirmedById: user!.id },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "PAYMENT_CONFIRMED", confirmedAt: now },
    });

    await tx.auditLog.create({
      data: {
        actorId: user!.id,
        action: "PAYMENT_CONFIRMED",
        entityType: "Booking",
        entityId: booking.id,
        metadata: JSON.stringify({ fee }),
      },
    });

    await tx.notification.create({
      data: {
        userId: booking.customerId,
        type: "PAYMENT_CONFIRMED",
        title: `Pembayaran pesanan ${booking.code} diterima`,
        body: "Toko sudah mengonfirmasi pembayaranmu. Tunggu kabar barang siap diambil.",
        href: `/orders/${booking.code}`,
      },
    });

    return ok({ message: "Pembayaran berhasil dikonfirmasi." });
  });
});