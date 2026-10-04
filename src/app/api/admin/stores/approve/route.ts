import { route, readJson, ok } from "@/server/api";
import { approveStore } from "@/server/services/store-review";
import { z } from "zod";

export const POST = route({ auth: true, roles: ["ADMIN"] }, async ({ req, user }) => {
    const { storeId } = await readJson(req, z.object({ storeId: z.string().min(1) }));
    await approveStore(user.id, storeId);
    return ok({}, "Toko disetujui.");
});