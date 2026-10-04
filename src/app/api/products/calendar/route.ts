import { route, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { getProductCalendar } from "@/server/services/availability";
import { eachDateKey, isDateKey } from "@/lib/dates";

const MAX_RANGE_DAYS = 400;

export const GET = route({}, async ({ req }) => {
    const sp = req.nextUrl.searchParams;
    const productId = sp.get("productId");
    const from = sp.get("from");
    const to = sp.get("to");

    if (!productId || !from || !to || !isDateKey(from) || !isDateKey(to) || from > to) {
        throw new AppError("Parameter kalender tidak valid.", 400);
    }
    if (eachDateKey(from, to).length > MAX_RANGE_DAYS) {
        throw new AppError("Rentang tanggal terlalu panjang.", 400);
    }

    // Kalender hanya untuk barang yang bisa dipesan publik.
    const product = await db.product.findUnique({
        where: { id: productId },
        select: { status: true, deletedAt: true, store: { select: { status: true } } },
    });
    if (!product || product.deletedAt || product.status !== "ACTIVE" || product.store.status !== "ACTIVE") {
        throw new AppError("Barang tidak ditemukan.", 404);
    }

    const calendar = await getProductCalendar(productId, from, to);
    if (!calendar) throw new AppError("Barang tidak ditemukan.", 404);

    return ok(calendar);
});