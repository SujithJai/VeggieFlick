import { z } from "zod";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import {
  addToCart,
  clearCart,
  getCartSummary,
  removeCartItem,
  updateCartItem,
} from "@/lib/services/cart";
import { addToCartSchema, updateCartSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/v1/cart — current basket with server-recalculated totals. */
export async function GET() {
  return handle(async () => ok(await getCartSummary(false)));
}

/** POST /api/v1/cart — add an item. */
export async function POST(request: Request) {
  return handle(async () => {
    const payload = await parseBody(request, addToCartSchema);
    return ok(await addToCart(payload));
  });
}

/** PATCH /api/v1/cart — update quantity (0 removes the line). */
export async function PATCH(request: Request) {
  return handle(async () => {
    const payload = await parseBody(request, updateCartSchema);
    return ok(await updateCartItem(payload.itemId, payload.quantity));
  });
}

const deleteSchema = z.object({ itemId: z.string().uuid().optional() });

/** DELETE /api/v1/cart — remove a single line or clear the basket. */
export async function DELETE(request: Request) {
  return handle(async () => {
    const url = new URL(request.url);
    const parsed = deleteSchema.safeParse({ itemId: url.searchParams.get("itemId") ?? undefined });
    if (!parsed.success) throw new ApiError("Invalid cart item id", 422, "VALIDATION_ERROR");
    if (parsed.data.itemId) return ok(await removeCartItem(parsed.data.itemId));
    return ok(await clearCart());
  });
}
