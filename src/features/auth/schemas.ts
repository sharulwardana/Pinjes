import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Format email belum benar.")),
  password: z.string().min(1, "Password wajib diisi.").max(200),
});

export const ACCOUNT_TYPES = ["renter", "owner"] as const;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama terlalu panjang."),
  email: z.string().trim().toLowerCase().pipe(z.email("Format email belum benar.")),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(200, "Password terlalu panjang.")
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Gunakan kombinasi huruf dan angka."),
  // The client only states intent. The server maps it to a role.
  accountType: z.enum(ACCOUNT_TYPES, { error: "Pilih jenis akun." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^(\+?62|0)8\d{7,12}$/.test(v.replace(/[\s-]/g, "")), "Nomor HP belum valid.")
    .optional()
    .default(""),
});
export type ProfileInput = z.infer<typeof profileSchema>;
