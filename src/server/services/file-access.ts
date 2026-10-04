import "server-only";
import { db } from "../db";

export type FileViewer = { id: string; role: string };

/**
 * Menentukan apakah user boleh membuka file privat.
 * Kepemilikan dicari dari path-nya di tabel yang relevan.
 * File privat yang tidak tercatat di mana pun ditolak.
 */
export async function canViewPrivateFile(user: FileViewer, relativePath: string): Promise<boolean> {
    if (user.role === "ADMIN") return true;

    // 1. Bukti transfer pelanggan
    const proof = await db.paymentProof.findUnique({
        where: { filePath: relativePath },
        select: {
            uploadedById: true,
            payment: {
                select: {
                    booking: {
                        select: { customerId: true, store: { select: { ownerId: true } } },
                    },
                },
            },
        },
    });
    if (proof) {
        const booking = proof.payment.booking;
        return (
            proof.uploadedById === user.id ||
            booking.customerId === user.id ||
            booking.store.ownerId === user.id
        );
    }

    // 2. Bukti deposit toko
    const deposit = await db.deposit.findUnique({
        where: { proofPath: relativePath },
        select: { store: { select: { ownerId: true } } },
    });
    if (deposit) return deposit.store.ownerId === user.id;

    // 3. Dokumen toko
    const doc = await db.storeDocument.findFirst({
        where: { filePath: relativePath },
        select: { store: { select: { ownerId: true } } },
    });
    if (doc) return doc.store.ownerId === user.id;

    // 4. QRIS toko: pemilik toko dan pelanggan yang punya pesanan di toko itu
    const store = await db.store.findFirst({
        where: { qrisImagePath: relativePath },
        select: { id: true, ownerId: true },
    });
    if (store) {
        if (store.ownerId === user.id) return true;
        const hasBooking = await db.booking.findFirst({
            where: { storeId: store.id, customerId: user.id },
            select: { id: true },
        });
        return Boolean(hasBooking);
    }

    return false;
}