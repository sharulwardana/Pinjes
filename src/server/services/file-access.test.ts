import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { canViewPrivateFile } from "@/server/services/file-access";
import { parseDateKey, todayKey } from "@/lib/dates";
import { makeOwnerWithStore, makeUser, resetDb } from "@/test/helpers";

const as = (u: { id: string } | { row: { id: string } }, role: string) => ({
    id: "row" in u ? u.row.id : u.id,
    role,
});

async function setup() {
    const customerA = await makeUser("CUSTOMER");
    const customerB = await makeUser("CUSTOMER");
    const admin = await makeUser("ADMIN");
    const { owner, store } = await makeOwnerWithStore();
    const { owner: otherOwner } = await makeOwnerWithStore();

    const booking = await db.booking.create({
        data: {
            code: "PJ-UJI0001",
            customerId: customerA.row.id,
            storeId: store.id,
            startDate: parseDateKey(todayKey()),
            endDate: parseDateKey(todayKey()),
            days: 1,
            subtotal: 100_000,
            total: 100_000,
        },
    });
    const payment = await db.payment.create({ data: { bookingId: booking.id, amount: 100_000 } });
    await db.paymentProof.create({
        data: {
            paymentId: payment.id,
            uploadedById: customerA.row.id,
            filePath: "payment-proof/bukti-a.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 1000,
            sha256: "hash-a",
        },
    });
    await db.deposit.create({
        data: {
            storeId: store.id,
            amount: 50_000,
            proofPath: "deposit-proof/deposit-a.jpg",
            proofMime: "image/jpeg",
            proofSha256: "hash-d",
        },
    });
    await db.storeDocument.create({
        data: {
            storeId: store.id,
            type: "BUSINESS_LICENSE",
            filePath: "store-doc/izin.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1000,
        },
    });
    await db.store.update({ where: { id: store.id }, data: { qrisImagePath: "qris/qris-a.png" } });

    return { customerA, customerB, admin, owner, otherOwner };
}

beforeEach(resetDb);

describe("bukti transfer", () => {
    const path = "payment-proof/bukti-a.jpg";

    it("boleh dibuka pelanggan yang mengunggah, pemilik toko di pesanan itu, dan admin", async () => {
        const s = await setup();
        expect(await canViewPrivateFile(as(s.customerA, "CUSTOMER"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.owner, "STORE_OWNER"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.admin, "ADMIN"), path)).toBe(true);
    });

    it("tidak boleh dibuka pelanggan lain", async () => {
        const s = await setup();
        expect(await canViewPrivateFile(as(s.customerB, "CUSTOMER"), path)).toBe(false);
    });

    it("tidak boleh dibuka pemilik toko lain", async () => {
        const s = await setup();
        expect(await canViewPrivateFile(as(s.otherOwner, "STORE_OWNER"), path)).toBe(false);
    });
});

describe("bukti deposit dan dokumen toko", () => {
    it("hanya pemilik toko dan admin yang boleh membuka bukti deposit", async () => {
        const s = await setup();
        const path = "deposit-proof/deposit-a.jpg";
        expect(await canViewPrivateFile(as(s.owner, "STORE_OWNER"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.admin, "ADMIN"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.otherOwner, "STORE_OWNER"), path)).toBe(false);
        expect(await canViewPrivateFile(as(s.customerA, "CUSTOMER"), path)).toBe(false);
    });

    it("hanya pemilik toko dan admin yang boleh membuka dokumen toko", async () => {
        const s = await setup();
        const path = "store-doc/izin.pdf";
        expect(await canViewPrivateFile(as(s.owner, "STORE_OWNER"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.admin, "ADMIN"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.otherOwner, "STORE_OWNER"), path)).toBe(false);
        expect(await canViewPrivateFile(as(s.customerA, "CUSTOMER"), path)).toBe(false);
    });
});

describe("QRIS toko", () => {
    const path = "qris/qris-a.png";

    it("boleh dibuka pemilik toko, admin, dan pelanggan yang punya pesanan di toko itu", async () => {
        const s = await setup();
        expect(await canViewPrivateFile(as(s.owner, "STORE_OWNER"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.admin, "ADMIN"), path)).toBe(true);
        expect(await canViewPrivateFile(as(s.customerA, "CUSTOMER"), path)).toBe(true);
    });

    it("tidak boleh dibuka pelanggan yang belum punya pesanan di toko itu", async () => {
        const s = await setup();
        expect(await canViewPrivateFile(as(s.customerB, "CUSTOMER"), path)).toBe(false);
    });

    it("tidak boleh dibuka pemilik toko lain", async () => {
        const s = await setup();
        expect(await canViewPrivateFile(as(s.otherOwner, "STORE_OWNER"), path)).toBe(false);
    });
});

describe("file yang tidak tercatat", () => {
    it("ditolak untuk semua orang kecuali admin", async () => {
        const s = await setup();
        const path = "payment-proof/tidak-tercatat.jpg";
        expect(await canViewPrivateFile(as(s.customerA, "CUSTOMER"), path)).toBe(false);
        expect(await canViewPrivateFile(as(s.owner, "STORE_OWNER"), path)).toBe(false);
    });
});