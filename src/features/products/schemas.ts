import { z } from "zod";
import { isDateKey } from "@/lib/dates";

export const PRODUCT_CATEGORIES = [
  "kamera",
  "camping",
  "elektronik",
  "kendaraan",
  "fashion",
  "lainnya",
] as const;

export const createProductSchema = z.object({
  name: z.string().trim().min(3, "Nama barang minimal 3 karakter.").max(100),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(2000),
  category: z.enum(PRODUCT_CATEGORIES, { error: "Pilih kategori." }),
  pricePerDay: z.coerce.number().int().min(1000, "Harga sewa minimal Rp 1.000 / hari."),
  deposit: z.coerce.number().int().min(0, "Deposit tidak boleh negatif."),
  stock: z.coerce.number().int().min(1, "Stok minimal 1."),
  // The first array element is the primary photo
  photos: z.array(z.string()).min(1, "Unggah minimal 1 foto barang.").max(5, "Maksimal 5 foto."),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).default("ACTIVE"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const searchSchema = z.object({
  q: z.string().trim().optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  startDate: z.string().refine(isDateKey, "Format tanggal mulai salah.").optional(),
  endDate: z.string().refine(isDateKey, "Format tanggal selesai salah.").optional(),
  sort: z.enum(["popular", "newest", "price_asc", "price_desc", "rating"]).default("popular"),
  page: z.coerce.number().int().min(1).default(1),
});

export type SearchInput = z.infer<typeof searchSchema>;
