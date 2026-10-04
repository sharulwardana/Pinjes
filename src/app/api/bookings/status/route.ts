import { route, readJson, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
  BOOKING_STATUS_META,
  CUSTOMER_CANCELLABLE,
  STORE_CANCELLABLE,
  STORE_TRANSITIONS,
  canTransition,
  type BookingStatus,
} from "@/features/booking/status";

const updateStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["READY_FOR_PICKUP", "RENTED", "RETURNED", "COMPLETED", "CANCELLED"]),
  reason: z.string().trim().max(300).optional(),
});

export const POST = route({ auth: true }, async ({ req, user }) => {
  const { bookingId, status, reason } = await readJson(req, updateStatusSchema);

  return await db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { store: { select: { ownerId: true } } },
    });

    if (!booking) throw new AppError("Pesanan tidak ditemukan.", 404);

    const isStoreOwner = booking.store.ownerId === user!.id;
    const isCustomer = booking.customerId === user!.id;
    if (!isStoreOwner && !isCustomer) throw new AppError("Akses ditolak.", 403);

    const from = booking.status as BookingStatus;

    if (status === "CANCELLED") {
      const allowed = isStoreOwner ? STORE_CANCELLABLE : CUSTOMER_CANCELLABLE;
      if (!allowed.includes(from)) {
        throw new AppError("Pesanan ini tidak bisa dibatalkan lagi.", 409);
      }
    } else {
      // Hanya toko yang boleh memajukan status, dan hanya satu langkah ke depan.
      if (!isStoreOwner) throw new AppError("Akses ditolak.", 403);
      if (STORE_TRANSITIONS[from]?.to !== status) {
        throw new AppError("Perubahan status tidak valid untuk pesanan ini.", 409);
      }
    }

    if (!canTransition(from, status)) {
      throw new AppError("Perubahan status tidak valid untuk pesanan ini.", 409);
    }

    const now = new Date();
    const data: Prisma.BookingUpdateManyMutationInput = { status };
    if (status === "READY_FOR_PICKUP") data.readyAt = now;
    if (status === "RENTED") data.pickedUpAt = now;
    if (status === "RETURNED") data.returnedAt = now;
    if (status === "COMPLETED") data.completedAt = now;
    if (status === "CANCELLED") {
      data.cancelledAt = now;
      data.cancelledById = user!.id;
      data.cancelReason = reason || null;
    }

    // Syarat status lama mencegah dua permintaan bersamaan saling menimpa.
    const result = await tx.booking.updateMany({
      where: { id: booking.id, status: from },
      data,
    });
    if (result.count === 0) {
      throw new AppError("Status pesanan baru saja berubah. Muat ulang halaman.", 409);
    }

    await tx.auditLog.create({
      data: {
        actorId: user!.id,
        action: "BOOKING_STATUS_CHANGED",
        entityType: "Booking",
        entityId: booking.id,
        metadata: JSON.stringify({ from, to: status, reason: reason || null }),
      },
    });

    // Beri tahu pihak yang lain.
    const label = BOOKING_STATUS_META[status].label;
    if (isStoreOwner) {
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          type: "BOOKING_STATUS",
          title: `Pesanan ${booking.code}: ${label}`,
          body: BOOKING_STATUS_META[status].description,
          href: `/orders/${booking.code}`,
        },
      });
    } else {
      await tx.notification.create({
        data: {
          userId: booking.store.ownerId,
          type: "BOOKING_STATUS",
          title: `Pesanan ${booking.code}: ${label}`,
          body: "Pelanggan membatalkan pesanan ini.",
          href: `/dashboard/store/orders/${booking.code}`,
        },
      });
    }

    return ok({}, "Status pesanan berhasil diperbarui.");
  });
});