import { describe, expect, it } from "vitest";
import {
    assertCanViewBooking,
    assertRole,
    assertStoreAccess,
    canStoreAcceptBookings,
    canViewBooking,
    ownStoreId,
} from "./policies";
import type { SessionUser } from "./services/auth";

const user = (over: Partial<SessionUser>): SessionUser => ({
    id: "u1",
    name: "Uji",
    email: "uji@example.com",
    phone: null,
    role: "CUSTOMER",
    storeId: null,
    ...over,
});

const customer = user({ id: "c1", role: "CUSTOMER" });
const owner = user({ id: "o1", role: "STORE_OWNER", storeId: "s1" });
const admin = user({ id: "a1", role: "ADMIN" });
const booking = { customerId: "c1", storeId: "s1" };

describe("saldo minimum untuk menerima pesanan", () => {
    it("saldo di atas biaya layanan boleh menerima pesanan", () => {
        expect(canStoreAcceptBookings(5001, 5000)).toBe(true);
    });

    it("saldo sama dengan biaya layanan tidak boleh", () => {
        expect(canStoreAcceptBookings(5000, 5000)).toBe(false);
    });

    it("saldo kosong atau di bawah biaya layanan tidak boleh", () => {
        expect(canStoreAcceptBookings(0, 5000)).toBe(false);
        expect(canStoreAcceptBookings(1000, 5000)).toBe(false);
    });

    it("kalau biaya layanan nol, toko selalu boleh", () => {
        expect(canStoreAcceptBookings(0, 0)).toBe(true);
    });
});

describe("akses toko", () => {
    it("pemilik toko hanya boleh menyentuh tokonya sendiri", () => {
        expect(() => assertStoreAccess(owner, "s1")).not.toThrow();
        expect(() => assertStoreAccess(owner, "s2")).toThrow();
    });

    it("admin boleh menyentuh toko mana pun", () => {
        expect(() => assertStoreAccess(admin, "s2")).not.toThrow();
    });

    it("pelanggan tidak boleh menyentuh toko mana pun", () => {
        expect(() => assertStoreAccess(customer, "s1")).toThrow();
    });

    it("ownStoreId menolak akun yang bukan pemilik toko", () => {
        expect(ownStoreId(owner)).toBe("s1");
        expect(() => ownStoreId(customer)).toThrow();
        expect(() => ownStoreId(user({ role: "STORE_OWNER", storeId: null }))).toThrow();
    });
});

describe("akses pesanan", () => {
    it("pelanggan pemilik pesanan boleh melihat", () => {
        expect(canViewBooking(customer, booking)).toBe(true);
    });

    it("pemilik toko yang bersangkutan boleh melihat", () => {
        expect(canViewBooking(owner, booking)).toBe(true);
    });

    it("admin boleh melihat", () => {
        expect(canViewBooking(admin, booking)).toBe(true);
    });

    it("pelanggan lain tidak boleh melihat", () => {
        expect(canViewBooking(user({ id: "c2" }), booking)).toBe(false);
        expect(() => assertCanViewBooking(user({ id: "c2" }), booking)).toThrow();
    });

    it("pemilik toko lain tidak boleh melihat", () => {
        expect(canViewBooking(user({ id: "o2", role: "STORE_OWNER", storeId: "s2" }), booking)).toBe(false);
    });
});

describe("pembatasan peran", () => {
    it("assertRole menolak peran yang tidak ada di daftar", () => {
        expect(() => assertRole(customer, ["ADMIN"])).toThrow();
        expect(() => assertRole(customer, ["CUSTOMER", "STORE_OWNER"])).not.toThrow();
    });
});