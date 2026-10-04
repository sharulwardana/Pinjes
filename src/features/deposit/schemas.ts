import { z } from "zod";
import { isDateKey } from "@/lib/dates";

export const createDepositSchema = z.object({
  amount: z.coerce.number().int().min(10000, "Minimal top-up Rp 10.000."),
  senderBank: z.string().trim().min(2, "Nama bank asal wajib diisi."),
  senderName: z.string().trim().min(2, "Nama pengirim wajib diisi."),
  transferDate: z.string().refine(isDateKey, "Format tanggal transfer salah."),
  proofFileId: z.string().min(1, "Bukti transfer wajib diunggah."),
});

export type CreateDepositInput = z.infer<typeof createDepositSchema>;
