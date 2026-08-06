import { handle, ok, paginationMeta, parseQuery } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listOrders } from "@/lib/services/order";
import { paginationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { page, limit } = parseQuery(request, paginationSchema);
    const { items, total } = await listOrders(session.id, page, limit);
    return ok(items, paginationMeta(page, limit, total));
  });
}
