import { route, readJson, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { z } from "zod";

const schema = z.object({
    bookingId: z.string().min(1),
    reason: z.string().trim().min(3, "Tulis alasan penolakan.").max(300),
});

// Waktu tambahan bagi pelanggan untuk mengunggah ulang bukti.
const REUPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;

export const POST = route({ auth: true }, async ({ req, user }) => {
    const { bookingId, reason } = await readJson(req, schema);

    return await db.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true, store: { select: { ownerId: true } } },
        });

        if (!booking) throw new AppError("Pesanan tidak ditemukan.", 404);
        if (booking.store.ownerId !== user!.id) throw new AppError("Akses ditolak.", 403);

        if (!booking.payment || booking.status !== "PAYMENT_SUBMITTED") {
            throw new AppError("Pesanan ini tidak sedang menunggu pemeriksaan pembayaran.", 400);
        }

        const now = new Date();

        await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "REJECTED", rejectedAt: now, rejectionReason: reason },
        });

        await tx.booking.update({
            where: { id: booking.id },
            data: {
                status: "PAYMENT_REJECTED",
                // Tanggal tetap ditahan selama pelanggan punya waktu mengunggah ulang.
                paymentDueAt: new Date(now.getTime() + REUPLOAD_WINDOW_MS),
            },
        });

        await tx.auditLog.create({
            data: {
                actorId: user!.id,
                action: "PAYMENT_REJECTED",
                entityType: "Booking",
                entityId: booking.id,
                metadata: JSON.stringify({ reason }),
            },
        });

        await tx.notification.create({
            data: {
                userId: booking.customerId,
                type: "PAYMENT_REJECTED",
                title: `Pembayaran pesanan ${booking.code} ditolak`,
                body: `Alasan: ${reason}. Unggah ulang bukti pembayaran yang benar.`,
                href: `/orders/${booking.code}`,
            },
        });

        return ok({}, "Pembayaran ditolak. Pelanggan akan diminta mengunggah ulang.");
    });
});