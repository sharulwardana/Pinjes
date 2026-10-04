import { route, ok } from "@/server/api";
import { revokeSession } from "@/server/services/auth";
import { getSessionToken, clearSessionCookie } from "@/server/session";

export const POST = route({}, async ({ meta }) => {
  const token = await getSessionToken();
  if (token) await revokeSession(token, meta);
  await clearSessionCookie();
  return ok(null, "Berhasil keluar.");
});
