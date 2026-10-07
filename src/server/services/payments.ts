import "server-only";
import { db } from "../db";
import { AppError } from "../errors";
import type { SessionUser } from "./auth";
import { sendWhatsApp } from "../notifications";

// Waktu tambahan bagi pelanggan untuk mengunggah ulang bukti yang ditolak.
const REUPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Toko mengonfirmasi pembayaran: biaya layanan dipotong dari saldo deposit toko. */
export async function confirmPayment(user: SessionUser, bookingId: string) {
    return await db.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                store: { select: { ownerId: true } },
                customer: { select: { phone: true, email: true } },
            },
        });

        if (!booking) throw new AppError("Pesanan tidak ditemukan.", 404);
        if (booking.store.ownerId !== user.id) throw new AppError("Akses ditolak.", 403);
        if (!booking.payment || booking.status !== "PAYMENT_SUBMITTED") {
            throw new AppError("Pesanan belum dibayar atau sudah diproses.", 400);
        }

        const now = new Date();

        // Kunci pesanan lebih dulu: hanya satu permintaan yang lolos dari PAYMENT_SUBMITTED.
        const claimed = await tx.booking.updateMany({
            where: { id: booking.id, status: "PAYMENT_SUBMITTED" },
            data: { status: "PAYMENT_CONFIRMED", confirmedAt: now },
        });
        if (claimed.count === 0) {
            throw new AppError("Pesanan ini baru saja diproses. Muat ulang halaman.", 409);
        }

        // Potong saldo hanya jika cukup. Jika gagal, seluruh transaksi dibatalkan.
        const fee = booking.platformFee;
        const deducted = await tx.store.updateMany({
            where: { id: booking.storeId, depositBalance: { gte: fee } },
            data: { depositBalance: { decrement: fee }, lockVersion: { increment: 1 } },
        });
        if (deducted.count === 0) {
            throw new AppError(
                "Saldo deposit toko tidak cukup untuk mengonfirmasi pesanan ini. Silakan top-up terlebih dahulu.",
                400,
            );
        }

        const store = await tx.store.findUniqueOrThrow({
            where: { id: booking.storeId },
            select: { depositBalance: true },
        });

        if (fee > 0) {
            await tx.depositTransaction.create({
                data: {
                    storeId: booking.storeId,
                    type: "SERVICE_FEE",
                    amount: -fee,
                    balanceBefore: store.depositBalance + fee,
                    balanceAfter: store.depositBalance,
                    referenceType: "BOOKING",
                    referenceId: booking.id,
                    description: `Potongan biaya layanan untuk pesanan ${booking.code}`,
                    createdById: user.id,
                },
            });
        }

        await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "CONFIRMED", confirmedAt: now, confirmedById: user.id },
        });

        await tx.auditLog.create({
            data: {
                actorId: user.id,
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

        if (booking.customer?.phone) {
            sendWhatsApp(
                booking.customer.phone,
                `Halo! Pembayaran untuk pesanan sewa ${booking.code} sudah dikonfirmasi toko. Pantau status pengambilan barang di akun PinjeS kamu.`,
            ).catch(() => {});
        }

        return true;
    });
}

/** Toko menolak bukti pembayaran. Saldo tidak berubah, pelanggan diminta mengunggah ulang. */
export async function rejectPayment(user: SessionUser, bookingId: string, reason: string) {
    const cleanReason = reason.trim();
    if (cleanReason.length < 3) throw new AppError("Tulis alasan penolakan.", 400);

    return await db.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true, store: { select: { ownerId: true } } },
        });

        if (!booking) throw new AppError("Pesanan tidak ditemukan.", 404);
        if (booking.store.ownerId !== user.id) throw new AppError("Akses ditolak.", 403);
        if (!booking.payment || booking.status !== "PAYMENT_SUBMITTED") {
            throw new AppError("Pesanan ini tidak sedang menunggu pemeriksaan pembayaran.", 400);
        }

        const now = new Date();

        const claimed = await tx.booking.updateMany({
            where: { id: booking.id, status: "PAYMENT_SUBMITTED" },
            data: {
                status: "PAYMENT_REJECTED",
                // Tanggal tetap ditahan selama pelanggan punya waktu mengunggah ulang.
                paymentDueAt: new Date(now.getTime() + REUPLOAD_WINDOW_MS),
            },
        });
        if (claimed.count === 0) {
            throw new AppError("Pesanan ini baru saja diproses. Muat ulang halaman.", 409);
        }

        await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "REJECTED", rejectedAt: now, rejectionReason: cleanReason },
        });

        await tx.auditLog.create({
            data: {
                actorId: user.id,
                action: "PAYMENT_REJECTED",
                entityType: "Booking",
                entityId: booking.id,
                metadata: JSON.stringify({ reason: cleanReason }),
            },
        });

        await tx.notification.create({
            data: {
                userId: booking.customerId,
                type: "PAYMENT_REJECTED",
                title: `Pembayaran pesanan ${booking.code} ditolak`,
                body: `Alasan: ${cleanReason}. Unggah ulang bukti pembayaran yang benar.`,
                href: `/orders/${booking.code}`,
            },
        });

        return true;
    });
}