import { handle, ok, parseBody } from "@/lib/api";
import { applyCouponToCart, removeCouponFromCart } from "@/lib/services/cart";
import { couponSchema } from "@/lib/validation";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/v1/coupon — active offers a shopper can apply. */
export async function GET() {
  return handle(async () => {
    const rows = await db
      .select({
        couponCode: coupons.couponCode,
        title: coupons.title,
        description: coupons.description,
        discountType: coupons.discountType,
        discountValue: coupons.discountValue,
        minimumOrderAmount: coupons.minimumOrderAmount,
        maximumDiscount: coupons.maximumDiscount,
        expiryDate: coupons.expiryDate,
      })
      .from(coupons)
      .where(and(eq(coupons.status, "active"), gt(coupons.expiryDate, new Date())))
      .orderBy(coupons.minimumOrderAmount);
    return ok(rows);
  });
}

/** POST /api/v1/coupon — apply a coupon to the basket. */
export async function POST(request: Request) {
  return handle(async () => {
    const { code } = await parseBody(request, couponSchema);
    return ok(await applyCouponToCart(code));
  });
}

/** DELETE /api/v1/coupon — remove the applied coupon. */
export async function DELETE() {
  return handle(async () => ok(await removeCouponFromCart()));
}
