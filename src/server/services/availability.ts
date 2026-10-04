import "server-only";
import type { Prisma } from "@prisma/client";
import { db, type Tx } from "../db";
import { ConflictError } from "../errors";
import { eachDateKey, parseDateKey, toDateKey, todayKey } from "@/lib/dates";
import { EXPIRING_STATUSES, ACTIVE_BOOKING_STATUSES } from "@/features/booking/status";

const HOLDING_STATUSES = ACTIVE_BOOKING_STATUSES.filter((s) => !EXPIRING_STATUSES.includes(s));

export const DATES_TAKEN_MESSAGE = "Maaf, tanggal tersebut baru saja dipesan.";

/** Bookings that currently reserve inventory. Unpaid bookings only hold stock until `paymentDueAt`. */
export function holdingBookingWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: { in: HOLDING_STATUSES } },
      { status: { in: EXPIRING_STATUSES }, OR: [{ paymentDueAt: null }, { paymentDueAt: { gt: now } }] },
    ],
  };
}

/** Reserved quantity per product per day within [fromKey, toKey]. */
export async function getDayUsage(client: Tx, productIds: string[], fromKey: string, toKey: string, now = new Date()) {
  const usage = new Map<string, Map<string, number>>();
  if (productIds.length === 0) return usage;
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);

  const items = await client.bookingItem.findMany({
    where: {
      productId: { in: productIds },
      booking: {
        // Overlap rule: existing_start <= requested_end AND existing_end >= requested_start
        startDate: { lte: to },
        endDate: { gte: from },
        ...holdingBookingWhere(now),
      },
    },
    select: { productId: true, quantity: true, booking: { select: { startDate: true, endDate: true } } },
  });

  for (const item of items) {
    const perDay = usage.get(item.productId) ?? new Map<string, number>();
    const s = toDateKey(item.booking.startDate);
    const e = toDateKey(item.booking.endDate);
    for (const key of eachDateKey(s > fromKey ? s : fromKey, e < toKey ? e : toKey)) {
      perDay.set(key, (perDay.get(key) ?? 0) + item.quantity);
    }
    usage.set(item.productId, perDay);
  }
  return usage;
}

export async function getBlockedDays(client: Tx, productIds: string[], fromKey: string, toKey: string) {
  const blocked = new Map<string, Map<string, string>>();
  if (productIds.length === 0) return blocked;
  const rows = await client.productAvailability.findMany({
    where: { productId: { in: productIds }, date: { gte: parseDateKey(fromKey), lte: parseDateKey(toKey) } },
    select: { productId: true, date: true, type: true },
  });
  for (const row of rows) {
    const m = blocked.get(row.productId) ?? new Map<string, string>();
    m.set(toDateKey(row.date), row.type);
    blocked.set(row.productId, m);
  }
  return blocked;
}

export type DayStatus = "available" | "booked" | "blocked" | "past";

export interface CalendarDay {
  date: string;
  status: DayStatus;
  remaining: number;
}

/** Public availability calendar for a product (no customer data exposed). */
export async function getProductCalendar(productId: string, fromKey: string, toKey: string, client: Tx = db) {
  const product = await client.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product) return null;
  const [usage, blocked] = await Promise.all([
    getDayUsage(client, [productId], fromKey, toKey),
    getBlockedDays(client, [productId], fromKey, toKey),
  ]);
  const today = todayKey();
  const used = usage.get(productId);
  const block = blocked.get(productId);
  const days: CalendarDay[] = eachDateKey(fromKey, toKey).map((date) => {
    const remaining = Math.max(0, product.stock - (used?.get(date) ?? 0));
    let status: DayStatus = "available";
    if (date < today) status = "past";
    else if (block?.has(date)) status = "blocked";
    else if (remaining <= 0) status = "booked";
    return { date, status, remaining: status === "available" ? remaining : 0 };
  });
  return { stock: product.stock, days };
}

/**
 * Throws ConflictError when any day in the range is blocked or has no stock left.
 * Must be called inside the booking transaction, after the product row is locked.
 */
export async function assertRangeAvailable(
  tx: Tx,
  product: { id: string; stock: number },
  startKey: string,
  endKey: string,
  quantity: number,
) {
  const [usage, blocked] = await Promise.all([
    getDayUsage(tx, [product.id], startKey, endKey),
    getBlockedDays(tx, [product.id], startKey, endKey),
  ]);
  const used = usage.get(product.id);
  const block = blocked.get(product.id);
  for (const day of eachDateKey(startKey, endKey)) {
    if (block?.has(day) || (used?.get(day) ?? 0) + quantity > product.stock) {
      throw new ConflictError(DATES_TAKEN_MESSAGE, "DATES_UNAVAILABLE");
    }
  }
}

/** Product ids that cannot be rented for the whole range (used by the search availability filter). */
export async function unavailableProductIds(fromKey: string, toKey: string, client: Tx = db): Promise<string[]> {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const [items, blockedRows] = await Promise.all([
    client.bookingItem.findMany({
      where: { booking: { startDate: { lte: to }, endDate: { gte: from }, ...holdingBookingWhere() } },
      select: { productId: true },
      distinct: ["productId"],
    }),
    client.productAvailability.findMany({
      where: { date: { gte: from, lte: to } },
      select: { productId: true },
      distinct: ["productId"],
    }),
  ]);
  const blockedIds = new Set(blockedRows.map((r) => r.productId));
  const candidateIds = [...new Set(items.map((i) => i.productId))].filter((id) => !blockedIds.has(id));
  const out = new Set(blockedIds);
  if (candidateIds.length) {
    const products = await client.product.findMany({ where: { id: { in: candidateIds } }, select: { id: true, stock: true } });
    const usage = await getDayUsage(client, candidateIds, fromKey, toKey);
    for (const p of products) {
      const perDay = usage.get(p.id);
      if (perDay && [...perDay.values()].some((q) => q >= p.stock)) out.add(p.id);
    }
  }
  return [...out];
}
