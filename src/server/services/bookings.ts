import "server-only";
import { db } from "../db";
import { assertRole, canStoreAcceptBookings } from "../policies";
import type { SessionUser } from "./auth";
import { isDateKey, parseDateKey, todayKey } from "@/lib/dates";
import { AppError } from "../errors";
import { getSettings } from "../settings";
import { assertRangeAvailable } from "./availability";
import { customAlphabet } from "nanoid";
import { EXPIRING_STATUSES } from "@/features/booking/status";
import { notify, sendWhatsApp } from "../notifications";

const nanoid = customAlphabet("1234567890ABCDEF", 8);

const DAY_MS = 24 * 60 * 60 * 1000;

export async function createBooking(
  user: SessionUser,
  productId: string,
  startDateStr: string,
  endDateStr: string,
  customerNote?: string
) {
  assertRole(user, ["CUSTOMER", "STORE_OWNER"]);

  if (!isDateKey(startDateStr) || !isDateKey(endDateStr) || startDateStr > endDateStr) {
    throw new AppError("Tanggal sewa tidak valid.", 400);
  }
  if (startDateStr < todayKey()) {
    throw new AppError("Tanggal mulai sewa tidak boleh di masa lalu.", 400);
  }

  const start = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;

  const settings = await getSettings();
  const serviceFee = settings.service_fee;

  return await db.$transaction(async (tx) => {
    // 1. Kunci produk lebih dulu supaya dua pemesan tidak lolos bersamaan.
    const locked = await tx.product.updateMany({
      where: { id: productId },
      data: { lockVersion: { increment: 1 } },
    });
    if (locked.count === 0) throw new AppError("Barang tidak ditemukan.", 404);

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        storeId: true,
        pricePerDay: true,
        securityDeposit: true,
        stock: true,
        minRentalDays: true,
        maxRentalDays: true,
        status: true,
        deletedAt: true,
        store: {
          select: { ownerId: true, status: true, deletedAt: true, depositBalance: true, whatsapp: true },
        },
      },
    });

    if (!product || product.deletedAt) throw new AppError("Barang tidak ditemukan.", 404);
    if (product.status !== "ACTIVE") throw new AppError("Barang ini sedang tidak tersedia untuk disewa.", 400);
    if (product.store.status !== "ACTIVE" || product.store.deletedAt) {
      throw new AppError("Toko ini sedang tidak menerima pesanan.", 400);
    }
    if (product.store.ownerId === user.id) {
      throw new AppError("Kamu tidak bisa menyewa barang dari tokomu sendiri.", 400);
    }
    if (days < product.minRentalDays) {
      throw new AppError(`Minimal sewa ${product.minRentalDays} hari.`, 400);
    }
    if (days > product.maxRentalDays) {
      throw new AppError(`Maksimal sewa ${product.maxRentalDays} hari.`, 400);
    }
    if (!canStoreAcceptBookings(product.store.depositBalance, serviceFee)) {
      throw new AppError("Toko ini belum bisa menerima pesanan saat ini.", 400);
    }

    // 2. Ketersediaan (stok per hari, blokir manual, booking kedaluwarsa diabaikan).
    await assertRangeAvailable(tx, product, startDateStr, endDateStr, 1);

    // 3. Harga
    const lineTotal = product.pricePerDay * days;
    const total = lineTotal + product.securityDeposit;
    const code = `PJ-${nanoid()}`;

    // 4. Simpan booking dan data pembayarannya
    const booking = await tx.booking.create({
      data: {
        code,
        customerId: user.id,
        storeId: product.storeId,
        status: "PENDING_PAYMENT",
        startDate: start,
        endDate: end,
        days,
        subtotal: lineTotal,
        platformFee: serviceFee, // dipotong dari deposit toko, bukan dari pelanggan
        total,
        customerNote: customerNote?.trim() || null,
        paymentDueAt: new Date(Date.now() + settings.payment_window_hours * 60 * 60 * 1000),
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            pricePerDay: product.pricePerDay,
            securityDeposit: product.securityDeposit,
            quantity: 1,
            days,
            lineTotal,
          },
        },
      },
    });

    await tx.payment.create({
      data: { bookingId: booking.id, amount: total, status: "PENDING" },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "BOOKING_CREATED",
        entityType: "Booking",
        entityId: booking.id,
        metadata: JSON.stringify({ code, days, total, platformFee: serviceFee }),
      },
    });

    if (product.store?.whatsapp) {
      sendWhatsApp(
        product.store.whatsapp,
        `Halo! Ada pesanan sewa baru #${booking.code} untuk "${product.name}" (${days} hari, total Rp ${total.toLocaleString("id-ID")}). Silakan periksa dashboard toko kamu di PinjeS.`,
      ).catch(() => {});
    }

    return booking;
  });
}

/**
 * Mengubah booking yang melewati batas bayar menjadi CANCELLED, supaya daftar
 * pesanan tidak menampilkan "Menunggu pembayaran" untuk pesanan yang sudah mati.
 * Aman dijalankan berulang dan bersamaan: update bersyarat status + batas waktu.
 */
export async function expireOverdueBookings(now: Date = new Date()): Promise<number> {
  const overdue = await db.booking.findMany({
    where: { status: { in: EXPIRING_STATUSES }, paymentDueAt: { lt: now } },
    select: { id: true, code: true, customerId: true },
    take: 200,
  });

  let expired = 0;
  for (const b of overdue) {
    await db.$transaction(async (tx) => {
      const res = await tx.booking.updateMany({
        where: { id: b.id, status: { in: EXPIRING_STATUSES }, paymentDueAt: { lt: now } },
        data: { status: "CANCELLED", cancelledAt: now, cancelReason: "Batas waktu pembayaran habis." },
      });
      if (res.count === 0) return; // sudah berubah oleh request lain
      expired += 1;
      await tx.auditLog.create({
        data: {
          action: "BOOKING_EXPIRED",
          entityType: "Booking",
          entityId: b.id,
          metadata: JSON.stringify({ code: b.code }),
        },
      });
      await notify(
        b.customerId,
        {
          type: "BOOKING_EXPIRED",
          title: "Pesanan dibatalkan",
          body: `Pesanan ${b.code} dibatalkan karena batas waktu pembayaran habis.`,
          href: `/orders/${b.code}`,
        },
        tx,
      );
    });
  }
  return expired;
}

export async function getCustomerBookings(user: SessionUser) {
  await expireOverdueBookings();
  return await db.booking.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      store: { select: { name: true, city: true } },
      items: {
        include: {
          product: { select: { slug: true, images: { take: 1 } } },
        },
      },
      payment: true,
    },
  });
}