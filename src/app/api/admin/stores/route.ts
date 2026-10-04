import { route, ok } from "@/server/api";
import { getPendingStores } from "@/server/services/store-review";

export const GET = route({ auth: true, roles: ["ADMIN"] }, async () => {
    return ok(await getPendingStores());
});