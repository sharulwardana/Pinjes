import { route, ok } from "@/server/api";

export const GET = route({}, async ({ user }) => {
  if (!user) return ok(null);
  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
  });
});
