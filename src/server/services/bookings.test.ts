import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createBooking } from "@/server/services/bookings";
import { parseDateKey, todayKey } from "@/lib/dates";
import { addDays, makeCategory, makeOwnerWithStore, makeProduct, makeUser, resetDb } from "@/test/helpers";

async function scenario(
    storeOver: Parameters<typeof makeOwnerWithStore>[0] = {},
    productOver: Parameters<typeof makeProduct>[2] = {},
) {
    const category = await makeCategory();
    const { owner, session: ownerSession, store } = await makeOwnerWithStore(storeOver);
    const product = await makeProduct(store.id, category.id, productOver);
    const customer = await makeUser("CUSTOMER");
    return { owner, ownerSession, store, product, customer: customer.session };
}

const start = () => addDays(todayKey(), 3);
const end = () => addDays(todayKey(), 4); // 2 hari

beforeEach(resetDb);

describe("createBooking: harga dan biaya", () => {
    it("menghitung subtotal, jaminan, total, dan biaya layanan dengan benar", async () => {
        const { product, customer } = await scenario();
        const booking = await createBooking(customer, product.id, start(), end());

        expect(booking.days).toBe(2);
        expect(booking.subtotal).toBe(200_000);
        expect(booking.total).toBe(250_000); // 200.000 + jaminan 50.000
        expect(booking.platformFee).toBe(5_000);
        expect(booking.status).toBe("PENDING_PAYMENT");
        expect(booking.code).toMatch(/^RS-/);

        const payment = await db.payment.findUnique({ where: { bookingId: booking.id } });
        expect(payment?.amount).toBe(250_000);
        expect(payment?.status).toBe("PENDING");
    });

    it("memakai biaya layanan dari setting admin", async () => {
        const { product, customer } = await scenario();
        await db.adminSetting.create({ data: { key: "service_fee", value: "7500" } });
        const booking = await createBooking(customer, product.id, start(), end());
        expect(booking.platformFee).toBe(7_500);
    });

    it("mencatat audit log pembuatan pesanan", async () => {
        const { product, customer } = await scenario();
        const booking = await createBooking(customer, product.id, start(), end());
        const log = await db.auditLog.findFirst({ where: { entityId: booking.id, action: "BOOKING_CREATED" } });
        expect(log).not.toBeNull();
    });
});

describe("createBooking: validasi", () => {
    it("menolak tanggal mulai di masa lalu", async () => {
        const { product, customer } = await scenario();
        await expect(
            createBooking(customer, product.id, addDays(todayKey(), -1), addDays(todayKey(), 1)),
        ).rejects.toThrow(/masa lalu/);
    });

    it("menolak tanggal selesai sebelum tanggal mulai", async () => {
        const { product, customer } = await scenario();
        await expect(
            createBooking(customer, product.id, addDays(todayKey(), 5), addDays(todayKey(), 3)),
        ).rejects.toThrow(/tidak valid/);
    });

    it("menolak format tanggal yang salah", async () => {
        const { product, customer } = await scenario();
        await expect(createBooking(customer, product.id, "besok", "lusa")).rejects.toThrow(/tidak valid/);
    });

    it("menolak sewa di bawah minimal hari", async () => {
        const { product, customer } = await scenario({}, { minRentalDays: 3 });
        await expect(createBooking(customer, product.id, start(), end())).rejects.toThrow(/Minimal sewa 3 hari/);
    });

    it("menolak sewa di atas maksimal hari", async () => {
        const { product, customer } = await scenario({}, { maxRentalDays: 1 });
        await expect(createBooking(customer, product.id, start(), end())).rejects.toThrow(/Maksimal sewa 1 hari/);
    });

    it("menolak barang yang tidak ditemukan", async () => {
        const { customer } = await scenario();
        await expect(createBooking(customer, "tidak-ada", start(), end())).rejects.toThrow(/tidak ditemukan/);
    });

    it("menolak barang yang tidak aktif", async () => {
        const { product, customer } = await scenario({}, { status: "INACTIVE" });
        await expect(createBooking(customer, product.id, start(), end())).rejects.toThrow(/tidak tersedia untuk disewa/);
    });

    it("menolak toko yang belum aktif", async () => {
        const { product, customer } = await scenario({ status: "PENDING_REVIEW" });
        await expect(createBooking(customer, product.id, start(), end())).rejects.toThrow(/tidak menerima pesanan/);
    });

    it("menolak toko yang saldo depositnya tidak lebih besar dari biaya layanan", async () => {
        const { product, customer } = await scenario({ depositBalance: 5_000 });
        await expect(createBooking(customer, product.id, start(), end())).rejects.toThrow(/belum bisa menerima pesanan/);
    });

    it("menolak pemilik toko menyewa barang tokonya sendiri", async () => {
        const { product, ownerSession } = await scenario();
        await expect(createBooking(ownerSession, product.id, start(), end())).rejects.toThrow(/tokomu sendiri/);
    });

    it("menolak admin membuat pesanan", async () => {
        const { product } = await scenario();
        const admin = await makeUser("ADMIN");
        await expect(createBooking(admin.session, product.id, start(), end())).rejects.toThrow();
    });
});

describe("createBooking: ketersediaan", () => {
    it("menolak tanggal yang bentrok saat stok 1", async () => {
        const { product, customer } = await scenario();
        const other = await makeUser("CUSTOMER");
        await createBooking(customer, product.id, start(), end());
        await expect(createBooking(other.session, product.id, end(), addDays(todayKey(), 6))).rejects.toThrow(
            /baru saja dipesan/,
        );
    });

    it("mengizinkan tanggal yang tidak bentrok", async () => {
        const { product, customer } = await scenario();
        const other = await makeUser("CUSTOMER");
        await createBooking(customer, product.id, start(), end());
        await expect(
            createBooking(other.session, product.id, addDays(todayKey(), 5), addDays(todayKey(), 6)),
        ).resolves.toBeDefined();
    });

    it("stok 2 mengizinkan dua pesanan di hari yang sama tapi tidak tiga", async () => {
        const { product, customer } = await scenario({}, { stock: 2 });
        const c2 = await makeUser("CUSTOMER");
        const c3 = await makeUser("CUSTOMER");
        await createBooking(customer, product.id, start(), end());
        await createBooking(c2.session, product.id, start(), end());
        await expect(createBooking(c3.session, product.id, start(), end())).rejects.toThrow(/baru saja dipesan/);
    });

    it("pesanan belum dibayar yang lewat batas waktu tidak menahan tanggal", async () => {
        const { product, customer } = await scenario();
        const other = await makeUser("CUSTOMER");
        const first = await createBooking(customer, product.id, start(), end());
        await db.booking.update({ where: { id: first.id }, data: { paymentDueAt: new Date(Date.now() - 60_000) } });
        await expect(createBooking(other.session, product.id, start(), end())).resolves.toBeDefined();
    });

    it("pesanan yang sudah dibayar tetap menahan tanggal walau batas bayar lewat", async () => {
        const { product, customer } = await scenario();
        const other = await makeUser("CUSTOMER");
        const first = await createBooking(customer, product.id, start(), end());
        await db.booking.update({
            where: { id: first.id },
            data: { status: "PAYMENT_CONFIRMED", paymentDueAt: new Date(Date.now() - 60_000) },
        });
        await expect(createBooking(other.session, product.id, start(), end())).rejects.toThrow(/baru saja dipesan/);
    });

    it("pesanan yang dibatalkan tidak menahan tanggal", async () => {
        const { product, customer } = await scenario();
        const other = await makeUser("CUSTOMER");
        const first = await createBooking(customer, product.id, start(), end());
        await db.booking.update({ where: { id: first.id }, data: { status: "CANCELLED" } });
        await expect(createBooking(other.session, product.id, start(), end())).resolves.toBeDefined();
    });

    it("menolak tanggal yang diblokir oleh toko", async () => {
        const { product, customer } = await scenario();
        await db.productAvailability.create({
            data: { productId: product.id, date: parseDateKey(start()), type: "BLOCKED" },
        });
        await expect(createBooking(customer, product.id, start(), end())).rejects.toThrow(/baru saja dipesan/);
    });

    it("dua pesanan bersamaan untuk tanggal yang sama: hanya satu yang berhasil", async () => {
        const { product, customer } = await scenario();
        const other = await makeUser("CUSTOMER");

        const results = await Promise.allSettled([
            createBooking(customer, product.id, start(), end()),
            createBooking(other.session, product.id, start(), end()),
        ]);

        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        expect(await db.booking.count({ where: { items: { some: { productId: product.id } } } })).toBe(1);
    });
});