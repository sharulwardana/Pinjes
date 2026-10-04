import "server-only";
import { db } from "../db";
import { AppError } from "../errors";
import type { SessionUser } from "./auth";

/** Yang harus lengkap sebelum toko boleh diajukan untuk ditinjau. */
export async function submitStoreForReview(user: SessionUser) {
    if (user.role !== "STORE_OWNER" || !user.storeId) {
        throw new AppError("Fitur ini khusus pemilik toko.", 403);
    }
    const storeId = user.storeId;

    return await db.$transaction(async (tx) => {
        const store = await tx.store.findUnique({ where: { id: storeId } });
        if (!store || store.deletedAt) throw new AppError("Toko tidak ditemukan.", 404);

        if (store.status !== "DRAFT" && store.status !== "REJECTED") {
            throw new AppError(
                store.status === "PENDING_REVIEW"
                    ? "Tokomu sudah diajukan dan sedang ditinjau."
                    : "Status tokomu tidak memungkinkan pengajuan.",
                409,
            );
        }

        const missing: string[] = [];
        if (!store.address.trim()) missing.push("alamat lengkap");
        if (!store.city.trim()) missing.push("kota");
        if (!store.whatsapp.trim()) missing.push("nomor WhatsApp");
        if (!store.bankAccountNumber && !store.qrisImagePath) missing.push("rekening bank atau QRIS");
        if (missing.length > 0) {
            throw new AppError(`Lengkapi dulu di Pengaturan Toko: ${missing.join(", ")}.`, 400);
        }

        // Syarat status lama mencegah dua klik bersamaan.
        const claimed = await tx.store.updateMany({
            where: { id: storeId, status: store.status },
            data: { status: "PENDING_REVIEW", submittedAt: new Date(), rejectionReason: null },
        });
        if (claimed.count === 0) throw new AppError("Status tokomu baru saja berubah. Muat ulang halaman.", 409);

        await tx.auditLog.create({
            data: {
                actorId: user.id,
                action: "STORE_SUBMITTED",
                entityType: "Store",
                entityId: storeId,
                metadata: JSON.stringify({ from: store.status }),
            },
        });

        // Beri tahu semua admin aktif.
        const admins = await tx.user.findMany({
            where: { roleKey: "ADMIN", status: "ACTIVE", deletedAt: null },
            select: { id: true },
        });
        for (const admin of admins) {
            await tx.notification.create({
                data: {
                    userId: admin.id,
                    type: "STORE_SUBMITTED",
                    title: "Toko baru menunggu tinjauan",
                    body: `${store.name} mengajukan pembukaan toko.`,
                    href: "/admin",
                },
            });
        }

        return true;
    });
}

export async function getPendingStores() {
    return await db.store.findMany({
        where: { status: "PENDING_REVIEW", deletedAt: null },
        orderBy: { submittedAt: "asc" },
        select: {
            id: true,
            name: true,
            city: true,
            address: true,
            phone: true,
            whatsapp: true,
            description: true,
            bankName: true,
            bankAccountName: true,
            bankAccountNumber: true,
            qrisImagePath: true,
            submittedAt: true,
            owner: { select: { name: true, email: true } },
        },
    });
}

export async function approveStore(adminId: string, storeId: string) {
    return await db.$transaction(async (tx) => {
        const store = await tx.store.findUnique({ where: { id: storeId }, select: { id: true, name: true, ownerId: true } });
        if (!store) throw new AppError("Toko tidak ditemukan.", 404);

        const claimed = await tx.store.updateMany({
            where: { id: storeId, status: "PENDING_REVIEW" },
            data: { status: "ACTIVE", verifiedAt: new Date(), rejectionReason: null },
        });
        if (claimed.count === 0) throw new AppError("Toko ini sudah diproses.", 409);

        await tx.auditLog.create({
            data: { actorId: adminId, action: "STORE_APPROVED", entityType: "Store", entityId: storeId },
        });
        await tx.notification.create({
            data: {
                userId: store.ownerId,
                type: "STORE_APPROVED",
                title: "Tokomu disetujui",
                body: "Tokomu sekarang aktif. Tambahkan barang dan pastikan saldo deposit cukup agar bisa menerima pesanan.",
                href: "/dashboard/store",
            },
        });
        return true;
    });
}

export async function rejectStore(adminId: string, storeId: string, reason: string) {
    const cleanReason = reason.trim();
    if (cleanReason.length < 3) throw new AppError("Tulis alasan penolakan.", 400);

    return await db.$transaction(async (tx) => {
        const store = await tx.store.findUnique({ where: { id: storeId }, select: { id: true, ownerId: true } });
        if (!store) throw new AppError("Toko tidak ditemukan.", 404);

        const claimed = await tx.store.updateMany({
            where: { id: storeId, status: "PENDING_REVIEW" },
            data: { status: "REJECTED", rejectionReason: cleanReason },
        });
        if (claimed.count === 0) throw new AppError("Toko ini sudah diproses.", 409);

        await tx.auditLog.create({
            data: {
                actorId: adminId,
                action: "STORE_REJECTED",
                entityType: "Store",
                entityId: storeId,
                metadata: JSON.stringify({ reason: cleanReason }),
            },
        });
        await tx.notification.create({
            data: {
                userId: store.ownerId,
                type: "STORE_REJECTED",
                title: "Pengajuan tokomu ditolak",
                body: `Alasan: ${cleanReason}. Perbaiki lalu ajukan lagi.`,
                href: "/dashboard/store",
            },
        });
        return true;
    });
}