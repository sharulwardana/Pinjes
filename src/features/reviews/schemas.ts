import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.string(),
  productId: z.string(),
  rating: z.coerce.number().min(1, "Minimal 1 bintang").max(5, "Maksimal 5 bintang"),
  comment: z.string().trim().min(5, "Ulasan terlalu pendek (min 5 karakter).").max(1000),
  photoPath: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
