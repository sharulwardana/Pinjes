import type { Prisma, RoleKey } from "@prisma/client";
import { db } from "@/server/db";
import type { SessionUser } from "@/server/services/auth";
import { parseDateKey, toDateKey } from "@/lib/dates";

let counter = 0;
const next = () => ++counter;

export const addDays = (key: string, n: number) =>
    toDateKey(new Date(parseDateKey(key).getTime() + n * 86_400_000));

/** Kosongkan semua tabel lalu isi ulang peran. Dipanggil sebelum tiap tes. */
export async function resetDb() {
    await db.auditLog.deleteMany();
    await db.notification.deleteMany();
    await db.depositTransaction.deleteMany();
    await db.deposit.deleteMany();
    await db.paymentProof.deleteMany();
    await db.payment.deleteMany();
    await db.bookingItem.deleteMany();
    await db.review.deleteMany();
    await db.booking.deleteMany();
    await db.productAvailability.deleteMany();
    await db.productImage.deleteMany();
    await db.favorite.deleteMany();
    await db.product.deleteMany();
    await db.category.deleteMany();
    await db.storeDocument.deleteMany();
    await db.store.deleteMany();
    await db.session.deleteMany();
    await db.user.deleteMany();
    await db.role.deleteMany();
    await db.adminSetting.deleteMany();
    await db.role.createMany({
        data: [
            { key: "CUSTOMER", name: "Pelanggan" },
            { key: "STORE_OWNER", name: "Pemilik toko" },
            { key: "ADMIN", name: "Admin" },
        ],
    });
}

export async function makeUser(roleKey: RoleKey) {
    const i = next();
    const row = await db.user.create({
        data: { name: `Pengguna ${i}`, email: `user${i}@example.com`, passwordHash: "x", roleKey },
    });
    const session: SessionUser = {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: null,
        role: roleKey,
        storeId: null,
    };
    return { row, session };
}

type StoreOverrides = Partial<Omit<Prisma.StoreUncheckedCreateInput, "ownerId" | "slug" | "name">>;

/** Pemilik toko beserta tokonya. Bawaan: toko ACTIVE dengan saldo deposit Rp100.000. */
export async function makeOwnerWithStore(over: StoreOverrides = {}) {
    const { row, session } = await makeUser("STORE_OWNER");
    const i = next();
    const store = await db.store.create({
        data: {
            ownerId: row.id,
            name: `Toko ${i}`,
            slug: `toko-${i}`,
            status: "ACTIVE",
            depositBalance: 100_000,
            ...over,
        },
    });
    return { owner: row, session: { ...session, storeId: store.id }, store };
}

export async function makeCategory() {
    const i = next();
    return db.category.create({ data: { name: `Kategori ${i}`, slug: `kategori-${i}` } });
}

type ProductOverrides = Partial<
    Omit<Prisma.ProductUncheckedCreateInput, "storeId" | "categoryId" | "slug" | "name" | "description" | "city">
>;

export async function makeProduct(storeId: string, categoryId: string, over: ProductOverrides = {}) {
    const i = next();
    return db.product.create({
        data: {
            storeId,
            categoryId,
            name: `Barang ${i}`,
            slug: `barang-${i}`,
            description: "Barang uji",
            city: "Semarang",
            pricePerDay: 100_000,
            securityDeposit: 50_000,
            stock: 1,
            status: "ACTIVE",
            ...over,
        },
    });
}