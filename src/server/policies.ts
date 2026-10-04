import "server-only";
import type { RoleKey } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "./errors";
import type { SessionUser } from "./services/auth";

/**
 * Authorization rules in one place. Services call these before touching data.
 * Roles are always read from the DB session (never from the client).
 */

export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "ADMIN";
}

export function assertRole(user: SessionUser, roles: RoleKey[]) {
  if (!roles.includes(user.role)) throw new ForbiddenError();
}

/** Returns the caller's own store id. Store owners can only ever manage this store. */
export function ownStoreId(user: SessionUser): string {
  if (user.role !== "STORE_OWNER" || !user.storeId) throw new ForbiddenError("Fitur ini khusus pemilik toko.");
  return user.storeId;
}

/** Store owners may only touch resources of their own store. Admins may touch all. */
export function assertStoreAccess(user: SessionUser, storeId: string) {
  if (user.role === "ADMIN") return;
  if (user.role === "STORE_OWNER" && user.storeId === storeId) return;
  // Respond 404 rather than 403 so ids of other stores cannot be probed.
  throw new NotFoundError();
}

/** Booking visibility: the customer, the store that owns it, or an admin. */
export function canViewBooking(user: SessionUser, booking: { customerId: string; storeId: string }) {
  return (
    user.role === "ADMIN" ||
    booking.customerId === user.id ||
    (user.role === "STORE_OWNER" && user.storeId === booking.storeId)
  );
}

export function assertCanViewBooking(user: SessionUser, booking: { customerId: string; storeId: string }) {
  if (!canViewBooking(user, booking)) throw new NotFoundError("Pesanan tidak ditemukan.");
}

/**
 * Store's ability to receive new bookings. Business rule: when the deposit balance
 * is at or below the service fee, the store stops receiving new bookings.
 */
export function canStoreAcceptBookings(balance: number, serviceFee: number) {
  return serviceFee === 0 || balance > serviceFee;
}
