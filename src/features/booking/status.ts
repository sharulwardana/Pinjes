/**
 * Booking state machine — the single source of truth for statuses,
 * labels and allowed transitions. Shared by server (enforcement) and UI.
 */

export const BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REJECTED",
  "READY_FOR_PICKUP",
  "RENTED",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; tone: Tone; description: string }> = {
  PENDING_PAYMENT: {
    label: "Menunggu pembayaran",
    tone: "warning",
    description: "Bayar langsung ke toko, lalu unggah bukti pembayaran.",
  },
  PAYMENT_SUBMITTED: {
    label: "Pembayaran diperiksa",
    tone: "info",
    description: "Toko sedang memeriksa bukti pembayaranmu.",
  },
  PAYMENT_CONFIRMED: {
    label: "Pembayaran diterima",
    tone: "success",
    description: "Pembayaran sudah dikonfirmasi toko. Tunggu kabar barang siap diambil.",
  },
  PAYMENT_REJECTED: {
    label: "Pembayaran ditolak",
    tone: "danger",
    description: "Bukti pembayaran ditolak toko. Periksa alasannya dan unggah ulang.",
  },
  READY_FOR_PICKUP: {
    label: "Siap diambil",
    tone: "accent",
    description: "Barang sudah disiapkan. Ambil di lokasi toko sesuai tanggal sewa.",
  },
  RENTED: {
    label: "Sedang disewa",
    tone: "accent",
    description: "Barang sedang kamu sewa. Kembalikan sesuai tanggal selesai.",
  },
  RETURNED: {
    label: "Sudah dikembalikan",
    tone: "info",
    description: "Barang sudah dikembalikan. Toko sedang menyelesaikan pesanan.",
  },
  COMPLETED: {
    label: "Selesai",
    tone: "neutral",
    description: "Pesanan selesai. Terima kasih sudah menyewa lewat PinjeS.",
  },
  CANCELLED: {
    label: "Dibatalkan",
    tone: "neutral",
    description: "Pesanan ini dibatalkan.",
  },
};

/** Statuses that keep inventory reserved for the booked dates. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PAYMENT_REJECTED",
  "PAYMENT_CONFIRMED",
  "READY_FOR_PICKUP",
  "RENTED",
];

/** Statuses that only hold inventory until `paymentDueAt`. */
export const EXPIRING_STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "PAYMENT_REJECTED"];

export const FINISHED_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED"];

/** Store-side operational transitions (excluding payment confirm/reject, handled separately). */
export const STORE_TRANSITIONS: Partial<Record<BookingStatus, { to: BookingStatus; label: string }>> = {
  PAYMENT_CONFIRMED: { to: "READY_FOR_PICKUP", label: "Siap Diambil" },
  READY_FOR_PICKUP: { to: "RENTED", label: "Sedang Disewa" },
  RENTED: { to: "RETURNED", label: "Barang Dikembalikan" },
  RETURNED: { to: "COMPLETED", label: "Selesaikan Pesanan" },
};

export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_PAYMENT: ["PAYMENT_SUBMITTED", "CANCELLED"],
  PAYMENT_SUBMITTED: ["PAYMENT_CONFIRMED", "PAYMENT_REJECTED", "CANCELLED"],
  PAYMENT_REJECTED: ["PAYMENT_SUBMITTED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["RENTED", "CANCELLED"],
  RENTED: ["RETURNED"],
  RETURNED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Customers may cancel only before paying. */
export const CUSTOMER_CANCELLABLE: BookingStatus[] = ["PENDING_PAYMENT", "PAYMENT_REJECTED"];

/** Stores may cancel before the item has been handed over. */
export const STORE_CANCELLABLE: BookingStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PAYMENT_REJECTED",
  "PAYMENT_CONFIRMED",
  "READY_FOR_PICKUP",
];

/** Tabs used on order lists. */
export const ORDER_FILTERS = [
  { value: "active", label: "Aktif", statuses: ACTIVE_BOOKING_STATUSES.concat(["RETURNED"]) },
  { value: "PENDING_PAYMENT", label: "Menunggu pembayaran", statuses: ["PENDING_PAYMENT", "PAYMENT_REJECTED"] },
  { value: "PAYMENT_SUBMITTED", label: "Diperiksa", statuses: ["PAYMENT_SUBMITTED"] },
  { value: "READY_FOR_PICKUP", label: "Siap diambil", statuses: ["PAYMENT_CONFIRMED", "READY_FOR_PICKUP"] },
  { value: "RENTED", label: "Sedang disewa", statuses: ["RENTED", "RETURNED"] },
  { value: "history", label: "Riwayat", statuses: FINISHED_STATUSES },
] as const satisfies readonly { value: string; label: string; statuses: readonly BookingStatus[] }[];
