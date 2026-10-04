import { route, readJson, ok } from "@/server/api";
import { confirmPayment } from "@/server/services/payments";
import { z } from "zod";

export const POST = route({ auth: true }, async ({ req, user }) => {
  const { bookingId } = await readJson(req, z.object({ bookingId: z.string().min(1) }));
  await confirmPayment(user, bookingId);
  return ok({ message: "Pembayaran berhasil dikonfirmasi." });
});