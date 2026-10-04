import { z } from "zod";
import { isDateKey } from "@/lib/dates";

export const createBookingSchema = z.object({
  productId: z.string().min(1, "Produk harus dipilih."),
  startDate: z.string().refine(isDateKey, "Format tanggal mulai salah."),
  endDate: z.string().refine(isDateKey, "Format tanggal selesai salah."),
  customerNote: z.string().trim().max(500, "Catatan maksimal 500 karakter.").optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const uploadPaymentProofSchema = z.object({
  bookingId: z.string(),
  fileId: z.string(), // Extracted from file upload endpoint response
  senderName: z.string().trim().min(3, "Nama pengirim minimal 3 karakter.").optional(),
});

export type UploadPaymentProofInput = z.infer<typeof uploadPaymentProofSchema>;
