import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { approveDeposit, getPendingDeposits, rejectDeposit } from "@/server/services/admin";
import { makeOwnerWithStore, makeUser, resetDb } from "@/test/helpers";

let n = 0;

async function pendingDeposit(balance = 20_000, amount = 50_000) {
    const { owner, store } = await makeOwnerWithStore({ depositBalance: balance });
    const admin = await makeUser("ADMIN");
    const deposit = await db.deposit.create({
        data: {
            storeId: store.id,
            amount,
            proofPath: `deposit-proof/uji-${++n}.jpg`,
            proofMime: "image/jpeg",
            proofSha256: `hash-${n}`,
            senderBank: "BCA",
            senderName: "Budi",
        },
    });
    return { owner, store, admin: admin.row, deposit };
}

const balanceOf = async (storeId: string) =>
    (await db.store.findUniqueOrThrow({ where: { id: storeId } })).depositBalance;

beforeEach(resetDb);

describe("approveDeposit", () => {
    it("menambah saldo toko dan menandai deposit disetujui", async () => {
        const { store, admin, deposit } = await pendingDeposit(20_000, 50_000);
        await approveDeposit(admin.id, deposit.id);

        expect(await balanceOf(store.id)).toBe(70_000);
        const updated = await db.deposit.findUniqueOrThrow({ where: { id: deposit.id } });
        expect(updated.status).toBe("APPROVED");
        expect(updated.reviewedById).toBe(admin.id);
    });

    it("mencatat ledger dengan saldo sebelum dan sesudah yang konsisten", async () => {
        const { store, admin, deposit } = await pendingDeposit(20_000, 50_000);
        await approveDeposit(admin.id, deposit.id);

        const entries = await db.depositTransaction.findMany({ where: { storeId: store.id } });
        expect(entries).toHaveLength(1);
        const [entry] = entries;
        expect(entry.type).toBe("TOP_UP");
        expect(entry.amount).toBe(50_000);
        expect(entry.balanceBefore).toBe(20_000);
        expect(entry.balanceAfter).toBe(70_000);
        expect(entry.balanceAfter - entry.balanceBefore).toBe(entry.amount);
        expect(entry.balanceAfter).toBe(await balanceOf(store.id));
    });

    it("menambah dari saldo terbaru, bukan menimpa dengan nilai lama", async () => {
        const { store, admin, deposit } = await pendingDeposit(20_000, 50_000);
        // Biaya layanan terpotong setelah deposit diajukan.
        await db.store.update({ where: { id: store.id }, data: { depositBalance: { decrement: 5_000 } } });
        await approveDeposit(admin.id, deposit.id);
        expect(await balanceOf(store.id)).toBe(65_000);
    });

    it("tidak bisa disetujui dua kali", async () => {
        const { store, admin, deposit } = await pendingDeposit(20_000, 50_000);
        await approveDeposit(admin.id, deposit.id);
        await expect(approveDeposit(admin.id, deposit.id)).rejects.toThrow(/sudah diproses/);

        expect(await balanceOf(store.id)).toBe(70_000);
        expect(await db.depositTransaction.count({ where: { storeId: store.id } })).toBe(1);
    });

    it("dua persetujuan bersamaan hanya menambah saldo sekali", async () => {
        const { store, admin, deposit } = await pendingDeposit(20_000, 50_000);
        const results = await Promise.allSettled([
            approveDeposit(admin.id, deposit.id),
            approveDeposit(admin.id, deposit.id),
        ]);

        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        expect(await balanceOf(store.id)).toBe(70_000);
        expect(await db.depositTransaction.count({ where: { storeId: store.id } })).toBe(1);
    });

    it("menolak deposit yang tidak ada", async () => {
        const { admin } = await pendingDeposit();
        await expect(approveDeposit(admin.id, "tidak-ada")).rejects.toThrow(/tidak ditemukan/);
    });

    it("mencatat audit log", async () => {
        const { admin, deposit } = await pendingDeposit();
        await approveDeposit(admin.id, deposit.id);
        const log = await db.auditLog.findFirst({ where: { entityId: deposit.id, action: "APPROVE_DEPOSIT" } });
        expect(log).not.toBeNull();
    });
});

describe("rejectDeposit", () => {
    it("menolak dengan alasan tanpa mengubah saldo", async () => {
        const { store, admin, deposit } = await pendingDeposit(20_000, 50_000);
        await rejectDeposit(admin.id, deposit.id, "Nominal tidak sesuai");

        expect(await balanceOf(store.id)).toBe(20_000);
        const updated = await db.deposit.findUniqueOrThrow({ where: { id: deposit.id } });
        expect(updated.status).toBe("REJECTED");
        expect(updated.rejectionReason).toBe("Nominal tidak sesuai");
        expect(await db.depositTransaction.count({ where: { storeId: store.id } })).toBe(0);
    });

    it("memberi tahu pemilik toko", async () => {
        const { owner, admin, deposit } = await pendingDeposit();
        await rejectDeposit(admin.id, deposit.id, "Bukti buram");
        const note = await db.notification.findFirst({ where: { userId: owner.id, type: "DEPOSIT_REJECTED" } });
        expect(note?.body).toContain("Bukti buram");
    });

    it("wajib menulis alasan", async () => {
        const { admin, deposit } = await pendingDeposit();
        await expect(rejectDeposit(admin.id, deposit.id, " ")).rejects.toThrow(/alasan/);
        expect((await db.deposit.findUniqueOrThrow({ where: { id: deposit.id } })).status).toBe("PENDING");
    });

    it("deposit yang sudah ditolak tidak bisa disetujui lagi", async () => {
        const { store, admin, deposit } = await pendingDeposit(20_000, 50_000);
        await rejectDeposit(admin.id, deposit.id, "Bukti buram");
        await expect(approveDeposit(admin.id, deposit.id)).rejects.toThrow(/sudah diproses/);
        expect(await balanceOf(store.id)).toBe(20_000);
    });
});

describe("getPendingDeposits", () => {
    it("hanya menampilkan deposit yang masih menunggu", async () => {
        const { admin, deposit } = await pendingDeposit();
        expect(await getPendingDeposits()).toHaveLength(1);
        await approveDeposit(admin.id, deposit.id);
        expect(await getPendingDeposits()).toHaveLength(0);
    });
});