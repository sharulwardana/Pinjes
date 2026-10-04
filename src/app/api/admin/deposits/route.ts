import { route, ok } from "@/server/api";
import { getPendingDeposits } from "@/server/services/admin";

export const GET = route({ auth: true, roles: ["ADMIN"] }, async () => {
  const deposits = await getPendingDeposits();
  return ok(deposits);
});
