import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { confirmPayment, rejectPayment } from "@/server/services/payments";
import { parseDateKey, todayKey } from "@/lib/dates";
import { makeOwnerWithStore, makeUser, resetDb } from "@/test/helpers";

let n = 0;

async function submittedBooking(opts: { balance?: number; fee?: number } = {}) {
    const { owner, session: ownerSession, store } = await makeOwnerWithStore({
        depositBalance: opts.balance ?? 20_000,
    });
    const customer = await makeUser("CUSTOMER");
    const booking = await db.booking.create({
        data: {
            code: `PJ-T${++n}`,
            customerId: customer.row.id,
            storeId: store.id,
            status: "PAYMENT_SUBMITTED",
            startDate: parseDateKey(todayKey()),
            endDate: parseDateKey(todayKey()),
            days: 1,
            subtotal: 100_000,
            platformFee: opts.fee ?? 5_000,
            total: 100_000,
        },
    });
    const payment = await db.payment.create({
        data: { bookingId: booking.id, amount: 100_000, status: "SUBMITTED" },
    });
    return { owner, ownerSession, store, customer, booking, payment };
}

const balanceOf = async (storeId: string) =>
    (await db.store.findUniqueOrThrow({ where: { id: storeId } })).depositBalance;
const statusOf = async (id: string) => (await db.booking.findUniqueOrThrow({ where: { id } })).status;

beforeEach(resetDb);

describe("confirmPayment", () => {
    it("memotong biaya layanan dari saldo dan mengubah status pesanan dan pembayaran", async () => {
        const s = await submittedBooking({ balance: 20_000, fee: 5_000 });
        await confirmPayment(s.ownerSession, s.booking.id);

        expect(await balanceOf(s.store.id)).toBe(15_000);
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_CONFIRMED");
        const payment = await db.payment.findUniqueOrThrow({ where: { id: s.payment.id } });
        expect(payment.status).toBe("CONFIRMED");
        expect(payment.confirmedById).toBe(s.owner.id);
    });

    it("mencatat ledger dengan saldo sebelum dan sesudah yang konsisten", async () => {
        const s = await submittedBooking({ balance: 20_000, fee: 5_000 });
        await confirmPayment(s.ownerSession, s.booking.id);

        const entries = await db.depositTransaction.findMany({ where: { storeId: s.store.id } });
        expect(entries).toHaveLength(1);
        const [entry] = entries;
        expect(entry.type).toBe("SERVICE_FEE");
        expect(entry.amount).toBe(-5_000);
        expect(entry.balanceBefore).toBe(20_000);
        expect(entry.balanceAfter).toBe(15_000);
        expect(entry.balanceAfter - entry.balanceBefore).toBe(entry.amount);
        expect(entry.referenceId).toBe(s.booking.id);
        expect(entry.balanceAfter).toBe(await balanceOf(s.store.id));
    });

    it("memberi tahu pelanggan dan mencatat audit log", async () => {
        const s = await submittedBooking();
        await confirmPayment(s.ownerSession, s.booking.id);

        expect(
            await db.notification.findFirst({ where: { userId: s.customer.row.id, type: "PAYMENT_CONFIRMED" } }),
        ).not.toBeNull();
        expect(
            await db.auditLog.findFirst({ where: { entityId: s.booking.id, action: "PAYMENT_CONFIRMED" } }),
        ).not.toBeNull();
    });

    it("saldo yang tepat sama dengan biaya layanan masih bisa dipotong sampai nol", async () => {
        const s = await submittedBooking({ balance: 5_000, fee: 5_000 });
        await confirmPayment(s.ownerSession, s.booking.id);
        expect(await balanceOf(s.store.id)).toBe(0);
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_CONFIRMED");
    });

    it("saldo kurang: ditolak, dan tidak ada yang berubah sama sekali", async () => {
        const s = await submittedBooking({ balance: 3_000, fee: 5_000 });
        await expect(confirmPayment(s.ownerSession, s.booking.id)).rejects.toThrow(/Saldo deposit toko tidak cukup/);

        expect(await balanceOf(s.store.id)).toBe(3_000);
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_SUBMITTED");
        expect((await db.payment.findUniqueOrThrow({ where: { id: s.payment.id } })).status).toBe("SUBMITTED");
        expect(await db.depositTransaction.count({ where: { storeId: s.store.id } })).toBe(0);
    });

    it("tidak bisa dikonfirmasi dua kali", async () => {
        const s = await submittedBooking({ balance: 20_000, fee: 5_000 });
        await confirmPayment(s.ownerSession, s.booking.id);
        await expect(confirmPayment(s.ownerSession, s.booking.id)).rejects.toThrow(/sudah diproses/);

        expect(await balanceOf(s.store.id)).toBe(15_000);
        expect(await db.depositTransaction.count({ where: { storeId: s.store.id } })).toBe(1);
    });

    it("dua konfirmasi bersamaan hanya memotong saldo sekali", async () => {
        const s = await submittedBooking({ balance: 20_000, fee: 5_000 });
        const results = await Promise.allSettled([
            confirmPayment(s.ownerSession, s.booking.id),
            confirmPayment(s.ownerSession, s.booking.id),
        ]);

        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        expect(await balanceOf(s.store.id)).toBe(15_000);
        expect(await db.depositTransaction.count({ where: { storeId: s.store.id } })).toBe(1);
    });

    it("menolak pesanan yang belum dibayar", async () => {
        const s = await submittedBooking();
        await db.booking.update({ where: { id: s.booking.id }, data: { status: "PENDING_PAYMENT" } });
        await expect(confirmPayment(s.ownerSession, s.booking.id)).rejects.toThrow(/belum dibayar atau sudah diproses/);
        expect(await balanceOf(s.store.id)).toBe(20_000);
    });

    it("menolak pemilik toko lain", async () => {
        const s = await submittedBooking();
        const other = await makeOwnerWithStore();
        await expect(confirmPayment(other.session, s.booking.id)).rejects.toThrow(/Akses ditolak/);
        expect(await balanceOf(s.store.id)).toBe(20_000);
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_SUBMITTED");
    });

    it("menolak pelanggan yang mencoba mengonfirmasi pesanannya sendiri", async () => {
        const s = await submittedBooking();
        await expect(confirmPayment(s.customer.session, s.booking.id)).rejects.toThrow(/Akses ditolak/);
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_SUBMITTED");
    });

    it("menolak pesanan yang tidak ada", async () => {
        const s = await submittedBooking();
        await expect(confirmPayment(s.ownerSession, "tidak-ada")).rejects.toThrow(/tidak ditemukan/);
    });
});

describe("rejectPayment", () => {
    it("mengubah status, menyimpan alasan, dan tidak menyentuh saldo", async () => {
        const s = await submittedBooking({ balance: 20_000 });
        await rejectPayment(s.ownerSession, s.booking.id, "Nominal tidak sesuai");

        expect(await statusOf(s.booking.id)).toBe("PAYMENT_REJECTED");
        const payment = await db.payment.findUniqueOrThrow({ where: { id: s.payment.id } });
        expect(payment.status).toBe("REJECTED");
        expect(payment.rejectionReason).toBe("Nominal tidak sesuai");
        expect(await balanceOf(s.store.id)).toBe(20_000);
        expect(await db.depositTransaction.count({ where: { storeId: s.store.id } })).toBe(0);
    });

    it("memberi pelanggan waktu sekitar satu hari untuk mengunggah ulang", async () => {
        const s = await submittedBooking();
        await rejectPayment(s.ownerSession, s.booking.id, "Bukti buram");
        const updated = await db.booking.findUniqueOrThrow({ where: { id: s.booking.id } });
        expect(updated.paymentDueAt!.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    });

    it("memberi tahu pelanggan dengan alasannya dan mencatat audit log", async () => {
        const s = await submittedBooking();
        await rejectPayment(s.ownerSession, s.booking.id, "Bukti buram");

        const note = await db.notification.findFirst({
            where: { userId: s.customer.row.id, type: "PAYMENT_REJECTED" },
        });
        expect(note?.body).toContain("Bukti buram");
        expect(
            await db.auditLog.findFirst({ where: { entityId: s.booking.id, action: "PAYMENT_REJECTED" } }),
        ).not.toBeNull();
    });

    it("wajib menulis alasan", async () => {
        const s = await submittedBooking();
        await expect(rejectPayment(s.ownerSession, s.booking.id, "  ")).rejects.toThrow(/alasan/);
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_SUBMITTED");
    });

    it("pembayaran yang sudah ditolak tidak bisa dikonfirmasi tanpa unggahan ulang", async () => {
        const s = await submittedBooking({ balance: 20_000 });
        await rejectPayment(s.ownerSession, s.booking.id, "Bukti buram");
        await expect(confirmPayment(s.ownerSession, s.booking.id)).rejects.toThrow(/belum dibayar atau sudah diproses/);
        expect(await balanceOf(s.store.id)).toBe(20_000);
    });

    it("pembayaran yang sudah dikonfirmasi tidak bisa ditolak", async () => {
        const s = await submittedBooking({ balance: 20_000 });
        await confirmPayment(s.ownerSession, s.booking.id);
        await expect(rejectPayment(s.ownerSession, s.booking.id, "Terlambat")).rejects.toThrow(
            /tidak sedang menunggu pemeriksaan/,
        );
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_CONFIRMED");
    });

    it("menolak pemilik toko lain", async () => {
        const s = await submittedBooking();
        const other = await makeOwnerWithStore();
        await expect(rejectPayment(other.session, s.booking.id, "Bukan tokoku")).rejects.toThrow(/Akses ditolak/);
        expect(await statusOf(s.booking.id)).toBe("PAYMENT_SUBMITTED");
    });
});