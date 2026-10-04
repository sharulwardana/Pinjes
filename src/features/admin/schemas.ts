import { z } from "zod";

export const approveDepositSchema = z.object({
  depositId: z.string(),
});
