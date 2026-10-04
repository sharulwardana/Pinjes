import { route, readJson, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { ownStoreId } from "@/server/policies";
import { deleteUpload, resolveUploadPath } from "@/server/uploads";
import { z } from "zod";

/** 0812..., 812..., 62812... -> 62812... */
function normalizeWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

const maskAccount = (n: string | null | undefined) => (n ? `****${n.slice(-4)}` : null);

const storeSettingsSchema = z
  .object({
    name: z.string().trim().min(3, "Nama toko minimal 3 karakter.").max(80, "Nama toko terlalu panjang."),
    tagline: z.string().trim().max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    city: z.string().trim().min(2, "Kota wajib diisi.").max(80),
    address: z.string().trim().max(200).optional(),
    phone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .refine((v) => !v || /^[0-9+\-\s()]{6,20}$/.test(v), "Nomor telepon tidak valid."),
    whatsapp: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{9,15}$/.test(v.replace(/\D/g, "")), "Nomor WhatsApp tidak valid."),
    openingHours: z.string().trim().max(120).optional(),
    latitude: z.coerce.number().min(-90, "Latitude tidak valid.").max(90, "Latitude tidak valid.").nullable().optional(),
    longitude: z.coerce.number().min(-180, "Longitude tidak valid.").max(180, "Longitude tidak valid.").nullable().optional(),
    bankName: z.string().trim().max(60).optional(),
    bankAccountNumber: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ?? "").replace(/[\s-]/g, ""))
      .refine((v) => v === "" || /^\d{5,20}$/.test(v), "Nomor rekening harus 5-20 angka."),
    bankAccountName: z.string().trim().max(80).optional(),
    // undefined = tidak berubah, null = hapus QRIS, string = path baru
    qrisImagePath: z.string().nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if ((v.latitude == null) !== (v.longitude == null)) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "Isi latitude dan longitude bersamaan." });
    }
    if (v.bankAccountNumber) {
      if (!v.bankName) ctx.addIssue({ code: "custom", path: ["bankName"], message: "Nama bank wajib diisi." });
      if (!v.bankAccountName) {
        ctx.addIssue({ code: "custom", path: ["bankAccountName"], message: "Nama pemilik rekening wajib diisi." });
      }
    }
  });

export const POST = route({ auth: true }, async ({ req, user }) => {
  const storeId = ownStoreId(user);
  const input = await readJson(req, storeSettingsSchema);

  const current = await db.store.findUnique({
    where: { id: storeId },
    select: { bankAccountNumber: true, qrisImagePath: true, ownerId: true },
  });
  if (!current) throw new AppError("Toko tidak ditemukan.", 404);

  // Validasi path QRIS baru
  const qrisChanged = input.qrisImagePath !== undefined && input.qrisImagePath !== current.qrisImagePath;
  if (qrisChanged && input.qrisImagePath) {
    if (resolveUploadPath(input.qrisImagePath)?.kind !== "qris") {
      throw new AppError("File QRIS tidak valid.", 400);
    }
    const usedByOther = await db.store.findFirst({
      where: { qrisImagePath: input.qrisImagePath, NOT: { id: storeId } },
      select: { id: true },
    });
    if (usedByOther) throw new AppError("File QRIS tidak valid.", 400);
  }

  const newAccount = input.bankAccountNumber || null;
  const accountChanged = (current.bankAccountNumber ?? null) !== newAccount;

  await db.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: storeId },
      data: {
        name: input.name,
        tagline: input.tagline || null,
        description: input.description ?? "",
        city: input.city,
        address: input.address ?? "",
        phone: input.phone ?? "",
        whatsapp: input.whatsapp ? normalizeWhatsapp(input.whatsapp) : "",
        openingHours: input.openingHours || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        bankName: newAccount ? input.bankName || null : null,
        bankAccountNumber: newAccount,
        bankAccountName: newAccount ? input.bankAccountName || null : null,
        ...(input.qrisImagePath !== undefined ? { qrisImagePath: input.qrisImagePath } : {}),
      },
    });

    if (accountChanged || qrisChanged) {
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "STORE_PAYMENT_INFO_CHANGED",
          entityType: "Store",
          entityId: storeId,
          metadata: JSON.stringify({
            accountFrom: maskAccount(current.bankAccountNumber),
            accountTo: maskAccount(newAccount),
            qrisChanged,
          }),
        },
      });
      await tx.notification.create({
        data: {
          userId: current.ownerId,
          type: "PAYMENT_INFO_CHANGED",
          title: "Informasi pembayaran tokomu diubah",
          body: "Rekening atau QRIS tokomu baru saja diubah. Jika bukan kamu, segera ganti password dan hubungi admin.",
          href: "/dashboard/store/settings",
        },
      });
    }
  });

  // Hapus file QRIS lama dari disk setelah database berhasil diperbarui.
  if (qrisChanged && current.qrisImagePath) {
    await deleteUpload(current.qrisImagePath);
  }

  return ok({ message: "Pengaturan berhasil disimpan." }, "Pengaturan berhasil disimpan.");
});