import { createHash } from "node:crypto";
import { route, readJson, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { uploadPaymentProofSchema } from "@/features/booking/schemas";
import { db } from "@/server/db";
import { readUpload } from "@/server/uploads";

// Folder tempat bukti transfer disimpan oleh API upload.
const PROOF_FOLDER = "payment-proof";

export const POST = route({ auth: true }, async ({ req, user }) => {
  const input = await readJson(req, uploadPaymentProofSchema);

  // Validasi file di luar transaksi (membaca disk lebih lambat dari database).
  const relativePath = input.fileId.replace(/\\/g, "/");
  if (
    relativePath.includes("..") ||
    relativePath.startsWith("/") ||
    !relativePath.startsWith(`${PROOF_FOLDER}/`)
  ) {
    throw new AppError("File bukti transfer tidak valid.", 400);
  }

  const file = await readUpload(relativePath);
  if (!file) {
    throw new AppError("File upload tidak ditemukan di server.", 400);
  }

  const sha256 = createHash("sha256").update(file.buf).digest("hex");

  return await db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { payment: true },
    });

    if (!booking) throw new AppError("Pesanan tidak ditemukan.", 404);
    if (booking.customerId !== user!.id) {
      throw new AppError("Anda tidak memiliki akses ke pesanan ini.", 403);
    }
    if (!booking.payment) {
      throw new AppError("Data pembayaran tidak ditemukan.", 400);
    }

    // Hanya boleh upload saat menunggu pembayaran atau setelah ditolak.
    if (
      booking.status !== "PENDING_PAYMENT" &&
      booking.status !== "PAYMENT_REJECTED"
    ) {
      throw new AppError(
        "Pesanan ini tidak bisa menerima bukti pembayaran lagi.",
        409,
      );
    }

    if (booking.payment.status === "CONFIRMED") {
      throw new AppError("Pembayaran sudah dikonfirmasi.", 400);
    }

    // Batas waktu bayar (hanya untuk pembayaran pertama).
    if (
      booking.paymentDueAt &&
      booking.paymentDueAt < new Date()
    ) {
      throw new AppError("Batas waktu pembayaran sudah lewat.", 409);
    }

    // Bukti yang sama tidak boleh dipakai di pesanan lain.
    const duplicate = await tx.paymentProof.findFirst({
      where: { sha256, NOT: { paymentId: booking.payment.id } },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError("Bukti transfer ini sudah pernah dipakai.", 409);
    }

    // File yang sama tidak boleh didaftarkan dua kali.
    const samePath = await tx.paymentProof.findUnique({
      where: { filePath: relativePath },
      select: { id: true },
    });
    if (samePath) {
      throw new AppError("File ini sudah pernah dipakai.", 409);
    }

    await tx.paymentProof.create({
      data: {
        paymentId: booking.payment.id,
        uploadedById: user!.id,
        filePath: relativePath,
        mimeType: file.mimeType,
        sizeBytes: file.buf.length,
        sha256,
        senderName: input.senderName,
      },
    });

    await tx.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        method: "BANK_TRANSFER",
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    const updated = await tx.booking.updateMany({
      where: {
        id: booking.id,
        status: { in: ["PENDING_PAYMENT", "PAYMENT_REJECTED"] },
      },
      data: { status: "PAYMENT_SUBMITTED" },
    });
    if (updated.count === 0) {
      throw new AppError("Status pesanan baru saja berubah. Muat ulang halaman.", 409);
    }

    await tx.auditLog.create({
      data: {
        actorId: user!.id,
        action: "PAYMENT_PROOF_SUBMITTED",
        entityType: "Booking",
        entityId: booking.id,
        metadata: JSON.stringify({ from: booking.status, to: "PAYMENT_SUBMITTED" }),
      },
    });

    return ok({ message: "Bukti transfer berhasil diunggah." });
  });
});