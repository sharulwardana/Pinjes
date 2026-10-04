import { route, readJson, ok } from "@/server/api";
import { AppError } from "@/server/errors";
import { createDepositSchema } from "@/features/deposit/schemas";
import { createDepositRequest, getStoreDeposits } from "@/server/services/deposit";

export const GET = route({ auth: true }, async ({ user }) => {
  if (user!.role !== "STORE_OWNER" || !user!.storeId) {
    throw new AppError("Akses ditolak.", 403);
  }
  const deposits = await getStoreDeposits(user!.storeId);
  return ok(deposits);
});

export const POST = route({ auth: true }, async ({ req, user }) => {
  const input = await readJson(req, createDepositSchema);
  const deposit = await createDepositRequest(user!, input);
  return ok(deposit);
});
