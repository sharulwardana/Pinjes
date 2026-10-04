import { route, readJson, ok } from "@/server/api";
import { registerSchema } from "@/features/auth/schemas";
import { registerUser, createSession } from "@/server/services/auth";
import { setSessionCookie } from "@/server/session";
import { RATE_LIMITS } from "@/server/rate-limit";

export const POST = route({ rateLimit: RATE_LIMITS.register }, async ({ req, meta }) => {
  const input = await readJson(req, registerSchema);
  const user = await registerUser(input, meta);
  const session = await createSession(user.id, meta);
  await setSessionCookie(session.token, session.expiresAt);
  return ok({ id: user.id, role: user.roleKey, storeId: null }, "Pendaftaran berhasil.");
});
