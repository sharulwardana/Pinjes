import { route, readJson, ok } from "@/server/api";
import { approveDeposit } from "@/server/services/admin";
import { approveDepositSchema } from "@/features/admin/schemas";

export const POST = route({ auth: true, roles: ["ADMIN"] }, async ({ req, user }) => {
  const { depositId } = await readJson(req, approveDepositSchema);
  await approveDeposit(user!.id, depositId);
  return ok({}, "Deposit berhasil disetujui.");
});
