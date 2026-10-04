import { route, readJson, ok } from "@/server/api";
import { searchSchema } from "@/features/products/schemas";
import { searchProducts } from "@/server/services/products";

export const POST = route({}, async ({ req }) => {
  const input = await readJson(req, searchSchema);
  const result = await searchProducts(input);
  return ok(result);
});
