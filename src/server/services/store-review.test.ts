import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import {
    approveStore,
    getPendingStores,
    rejectStore,
    submitStoreForReview,
} from "@/server/services/store-review";
import { makeOwnerWithStore, makeUser, resetDb } from "@/test/helpers";

const completeProfile = {
    address: "Jl. Pandanaran No. 1",
    city: "Semarang",
    whatsapp: "628123456789",
    bankName: "BCA",
    bankAccountNumber: "1234567890",
    bankAccountName: "Budi",
};

async function draftStore(over: Parameters<typeof makeOwnerWithStore>[0] = {}) {
    return makeOwnerWithStore({ status: "DRAFT", ...completeProfile, ...over });
}

beforeEach(resetDb);

describe("submitStoreForReview", () => {
    it("menolak toko yang profilnya belum lengkap dan menyebut yang kurang", async () => {
        const { session } = await draftStore({ address: "", whatsapp: "", bankAccountNumber: null });
        await expect(submitStoreForReview(session)).rejects.toThrow(/alamat lengkap.*nomor WhatsApp.*rekening bank atau QRIS/);
    });

    it("menerima toko dengan QRIS saja tanpa rekening bank", async () => {
        const { session, store } = await draftStore({ bankAccountNumber: null, qrisImagePath: "qris/x.png" });
        await submitStoreForReview(session);
        expect((await db.store.findUniqueOrThrow({ where: { id: store.id } })).status).toBe("PENDING_REVIEW");
    });

    it("mengubah status menjadi PENDING_REVIEW dan mencatat waktu pengajuan", async () => {
        const { session, store } = await draftStore();
        await submitStoreForReview(session);
        const updated = await db.store.findUniqueOrThrow({ where: { id: store.id } });
        expect(updated.status).toBe("PENDING_REVIEW");
        expect(updated.submittedAt).not.toBeNull();
    });

    it("memberi tahu semua admin aktif", async () => {
        const { session } = await draftStore();
        const admin = await makeUser("ADMIN");
        await submitStoreForReview(session);
        const note = await db.notification.findFirst({ where: { userId: admin.row.id, type: "STORE_SUBMITTED" } });
        expect(note).not.toBeNull();
    });

    it("tidak bisa diajukan dua kali", async () => {
        const { session } = await draftStore();
        await submitStoreForReview(session);
        await expect(submitStoreForReview(session)).rejects.toThrow(/sedang ditinjau/);
    });

    it("toko yang sudah aktif tidak bisa diajukan lagi", async () => {
        const { session } = await draftStore({ status: "ACTIVE" });
        await expect(submitStoreForReview(session)).rejects.toThrow(/tidak memungkinkan/);
    });

    it("menolak akun yang bukan pemilik toko", async () => {
        const customer = await makeUser("CUSTOMER");
        await expect(submitStoreForReview(customer.session)).rejects.toThrow(/khusus pemilik toko/);
    });
});

describe("approveStore dan rejectStore", () => {
    it("menyetujui toko: status ACTIVE, waktu verifikasi tercatat, pemilik diberi tahu", async () => {
        const { owner, session, store } = await draftStore();
        const admin = await makeUser("ADMIN");
        await submitStoreForReview(session);
        await approveStore(admin.row.id, store.id);

        const updated = await db.store.findUniqueOrThrow({ where: { id: store.id } });
        expect(updated.status).toBe("ACTIVE");
        expect(updated.verifiedAt).not.toBeNull();
        expect(await db.notification.findFirst({ where: { userId: owner.id, type: "STORE_APPROVED" } })).not.toBeNull();
    });

    it("tidak bisa menyetujui toko yang belum diajukan", async () => {
        const { store } = await draftStore();
        const admin = await makeUser("ADMIN");
        await expect(approveStore(admin.row.id, store.id)).rejects.toThrow(/sudah diproses/);
        expect((await db.store.findUniqueOrThrow({ where: { id: store.id } })).status).toBe("DRAFT");
    });

    it("tidak bisa disetujui dua kali", async () => {
        const { session, store } = await draftStore();
        const admin = await makeUser("ADMIN");
        await submitStoreForReview(session);
        await approveStore(admin.row.id, store.id);
        await expect(approveStore(admin.row.id, store.id)).rejects.toThrow(/sudah diproses/);
    });

    it("menolak toko dengan alasan dan pemilik bisa mengajukan ulang", async () => {
        const { owner, session, store } = await draftStore();
        const admin = await makeUser("ADMIN");
        await submitStoreForReview(session);
        await rejectStore(admin.row.id, store.id, "Foto QRIS tidak jelas");

        let updated = await db.store.findUniqueOrThrow({ where: { id: store.id } });
        expect(updated.status).toBe("REJECTED");
        expect(updated.rejectionReason).toBe("Foto QRIS tidak jelas");
        expect(await db.notification.findFirst({ where: { userId: owner.id, type: "STORE_REJECTED" } })).not.toBeNull();

        await submitStoreForReview(session);
        updated = await db.store.findUniqueOrThrow({ where: { id: store.id } });
        expect(updated.status).toBe("PENDING_REVIEW");
        expect(updated.rejectionReason).toBeNull();
    });

    it("penolakan wajib menulis alasan", async () => {
        const { session, store } = await draftStore();
        const admin = await makeUser("ADMIN");
        await submitStoreForReview(session);
        await expect(rejectStore(admin.row.id, store.id, "  ")).rejects.toThrow(/alasan/);
        expect((await db.store.findUniqueOrThrow({ where: { id: store.id } })).status).toBe("PENDING_REVIEW");
    });

    it("menolak toko yang tidak ada", async () => {
        const admin = await makeUser("ADMIN");
        await expect(approveStore(admin.row.id, "tidak-ada")).rejects.toThrow(/tidak ditemukan/);
    });
});

describe("getPendingStores", () => {
    it("hanya menampilkan toko yang menunggu tinjauan", async () => {
        const a = await draftStore();
        await draftStore(); // tetap DRAFT
        await submitStoreForReview(a.session);

        const pending = await getPendingStores();
        expect(pending).toHaveLength(1);
        expect(pending[0].id).toBe(a.store.id);
    });
});