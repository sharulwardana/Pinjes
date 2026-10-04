import { route, readJson, ok } from "@/server/api";
import { loginSchema } from "@/features/auth/schemas";
import { authenticate, createSession } from "@/server/services/auth";
import { setSessionCookie } from "@/server/session";
import { RATE_LIMITS } from "@/server/rate-limit";

export const POST = route({ rateLimit: RATE_LIMITS.login }, async ({ req, meta }) => {
  const input = await readJson(req, loginSchema);
  const user = await authenticate(input, meta);
  const session = await createSession(user.id, meta);
  await setSessionCookie(session.token, session.expiresAt);
  return ok({ id: user.id, role: user.roleKey }, "Berhasil masuk.");
});
