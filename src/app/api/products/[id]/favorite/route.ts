import { route, ok } from "@/server/api";
import { isProductFavorited, toggleProductFavorite } from "@/server/services/favorites";

export const GET = route<{ id: string }>({ auth: false }, async ({ params, user }) => {
  const p = await params;
  if (!user) return ok({ favorited: false });
  const favorited = await isProductFavorited(user.id, p.id);
  return ok({ favorited });
});

export const POST = route<{ id: string }>({ auth: true }, async ({ params, user }) => {
  const p = await params;
  const result = await toggleProductFavorite(user.id, p.id);
  return ok(result);
});
