import { z } from "zod";
import { handle, notFound, ok, parseBody } from "@/lib/api";
import { BACK_OFFICE_ROLES, requireUser } from "@/lib/auth";
import { addToCart } from "@/lib/services/cart";
import { cancelOrder, getOrderDetail, reorder } from "@/lib/services/order";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await context.params;
    const staff = BACK_OFFICE_ROLES.includes(session.role);
    const order = await getOrderDetail(id, staff ? undefined : session.id);
    if (!order) return notFound("Order not found");
    return ok(order);
  });
}

const actionSchema = z.object({
  action: z.enum(["cancel", "reorder"]),
  reason: z.string().trim().max(240).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await context.params;
    const { action, reason } = await parseBody(request, actionSchema);

    if (action === "cancel") {
      await cancelOrder(id, session.id, reason);
      return ok({ cancelled: true });
    }

    const items = await reorder(id, session.id);
    for (const item of items) {
      await addToCart({ productId: item.productId, variantId: item.variantId, quantity: item.quantity }).catch(
        () => undefined,
      );
    }
    return ok({ reordered: true, items: items.length });
  });
}
