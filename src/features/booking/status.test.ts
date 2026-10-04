import { describe, expect, it } from "vitest";
import {
    ACTIVE_BOOKING_STATUSES,
    ALLOWED_TRANSITIONS,
    BOOKING_STATUSES,
    BOOKING_STATUS_META,
    CUSTOMER_CANCELLABLE,
    EXPIRING_STATUSES,
    FINISHED_STATUSES,
    ORDER_FILTERS,
    STORE_CANCELLABLE,
    STORE_TRANSITIONS,
    canTransition,
} from "./status";

describe("alur status pesanan", () => {
    it("setiap status punya label dan aturan perpindahan", () => {
        for (const s of BOOKING_STATUSES) {
            expect(BOOKING_STATUS_META[s].label.length).toBeGreaterThan(0);
            expect(ALLOWED_TRANSITIONS[s]).toBeDefined();
        }
    });

    it("status akhir tidak bisa berpindah ke mana pun", () => {
        expect(ALLOWED_TRANSITIONS.COMPLETED).toEqual([]);
        expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
    });

    it("pesanan selesai atau dibatalkan tidak bisa dihidupkan lagi", () => {
        for (const to of BOOKING_STATUSES) {
            expect(canTransition("COMPLETED", to)).toBe(false);
            expect(canTransition("CANCELLED", to)).toBe(false);
        }
    });

    it("alur normal dari pembayaran sampai selesai diizinkan", () => {
        const path = [
            "PENDING_PAYMENT",
            "PAYMENT_SUBMITTED",
            "PAYMENT_CONFIRMED",
            "READY_FOR_PICKUP",
            "RENTED",
            "RETURNED",
            "COMPLETED",
        ] as const;
        for (let i = 0; i < path.length - 1; i++) {
            expect(canTransition(path[i], path[i + 1])).toBe(true);
        }
    });

    it("tidak boleh melompati langkah", () => {
        expect(canTransition("PENDING_PAYMENT", "PAYMENT_CONFIRMED")).toBe(false);
        expect(canTransition("PAYMENT_SUBMITTED", "RENTED")).toBe(false);
        expect(canTransition("PAYMENT_CONFIRMED", "RETURNED")).toBe(false);
        expect(canTransition("READY_FOR_PICKUP", "COMPLETED")).toBe(false);
    });

    it("pembayaran yang ditolak bisa diunggah ulang", () => {
        expect(canTransition("PAYMENT_SUBMITTED", "PAYMENT_REJECTED")).toBe(true);
        expect(canTransition("PAYMENT_REJECTED", "PAYMENT_SUBMITTED")).toBe(true);
    });

    it("barang yang sedang disewa tidak bisa dibatalkan", () => {
        expect(canTransition("RENTED", "CANCELLED")).toBe(false);
        expect(STORE_CANCELLABLE).not.toContain("RENTED");
        expect(CUSTOMER_CANCELLABLE).not.toContain("RENTED");
    });

    it("setiap status yang boleh dibatalkan memang punya jalur ke CANCELLED", () => {
        for (const s of [...CUSTOMER_CANCELLABLE, ...STORE_CANCELLABLE]) {
            expect(canTransition(s, "CANCELLED")).toBe(true);
        }
    });

    it("pelanggan hanya bisa membatalkan sebelum pembayaran dikonfirmasi", () => {
        expect(CUSTOMER_CANCELLABLE).toEqual(["PENDING_PAYMENT", "PAYMENT_REJECTED"]);
    });

    it("langkah operasional toko semuanya valid di mesin status", () => {
        for (const [from, step] of Object.entries(STORE_TRANSITIONS)) {
            expect(canTransition(from as keyof typeof ALLOWED_TRANSITIONS, step!.to)).toBe(true);
        }
    });

    it("hanya status yang menahan stok yang dihitung aktif", () => {
        for (const s of FINISHED_STATUSES) expect(ACTIVE_BOOKING_STATUSES).not.toContain(s);
        expect(ACTIVE_BOOKING_STATUSES).not.toContain("RETURNED");
    });

    it("status yang batas waktunya habis adalah status yang belum dibayar", () => {
        expect(EXPIRING_STATUSES).toEqual(["PENDING_PAYMENT", "PAYMENT_REJECTED"]);
        for (const s of EXPIRING_STATUSES) expect(ACTIVE_BOOKING_STATUSES).toContain(s);
    });

    it("setiap tab daftar pesanan hanya berisi status yang dikenal", () => {
        for (const f of ORDER_FILTERS) {
            for (const s of f.statuses) expect(BOOKING_STATUSES).toContain(s);
        }
    });
});