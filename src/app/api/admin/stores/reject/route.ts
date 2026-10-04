import { route, readJson, ok } from "@/server/api";
import { rejectStore } from "@/server/services/store-review";
import { z } from "zod";

const schema = z.object({
    storeId: z.string().min(1),
    reason: z.string().trim().min(3, "Tulis alasan penolakan.").max(300),
});

export const POST = route({ auth: true, roles: ["ADMIN"] }, async ({ req, user }) => {
    const { storeId, reason } = await readJson(req, schema);
    await rejectStore(user.id, storeId, reason);
    return ok({}, "Toko ditolak.");
});