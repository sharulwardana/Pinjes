import { route, ok } from "@/server/api";
import { submitStoreForReview } from "@/server/services/store-review";

export const POST = route({ auth: true }, async ({ user }) => {
    await submitStoreForReview(user);
    return ok({}, "Tokomu diajukan untuk ditinjau.");
});