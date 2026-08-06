import { handle, ok, paginationMeta, parseQuery } from "@/lib/api";
import { listProducts } from "@/lib/services/catalog";
import { productQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    const query = parseQuery(request, productQuerySchema);
    const { items, total } = await listProducts(query);
    return ok(items, paginationMeta(query.page, query.limit, total));
  });
}
