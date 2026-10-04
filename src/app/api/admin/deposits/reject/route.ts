import { route, readJson, ok } from "@/server/api";
import { rejectDeposit } from "@/server/services/admin";
import { z } from "zod";

const rejectDepositSchema = z.object({
    depositId: z.string().min(1),
    reason: z.string().trim().min(3, "Tulis alasan penolakan.").max(300),
});

export const POST = route({ auth: true, roles: ["ADMIN"] }, async ({ req, user }) => {
    const { depositId, reason } = await readJson(req, rejectDepositSchema);
    await rejectDeposit(user!.id, depositId, reason);
    return ok({}, "Deposit ditolak.");
});