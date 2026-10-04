import { route, readJson, ok } from "@/server/api";
import { rejectPayment } from "@/server/services/payments";
import { z } from "zod";

const schema = z.object({
    bookingId: z.string().min(1),
    reason: z.string().trim().min(3, "Tulis alasan penolakan.").max(300),
});

export const POST = route({ auth: true }, async ({ req, user }) => {
    const { bookingId, reason } = await readJson(req, schema);
    await rejectPayment(user, bookingId, reason);
    return ok({}, "Pembayaran ditolak. Pelanggan akan diminta mengunggah ulang.");
});