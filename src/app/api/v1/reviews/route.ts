import { and, avg, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, products, profiles, reviews } from "@/db/schema";
import { ApiError, created, handle, ok, parseBody, parseQuery } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const querySchema = z.object({ productId: z.string().uuid() });

export async function GET(request: Request) {
  return handle(async () => {
    const { productId } = parseQuery(request, querySchema);
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        reviewTitle: reviews.reviewTitle,
        review: reviews.review,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        createdAt: reviews.createdAt,
        authorName: profiles.fullName,
      })
      .from(reviews)
      .innerJoin(profiles, eq(profiles.id, reviews.profileId))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))
      .limit(30);
    return ok(rows);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const payload = await parseBody(request, reviewSchema);

    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, payload.productId), eq(reviews.profileId, session.id)))
      .limit(1);
    if (existing) throw new ApiError("You have already reviewed this product", 409, "DUPLICATE_REVIEW");

    const [purchase] = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orderItems.productId, payload.productId), eq(orders.profileId, session.id)))
      .limit(1);

    const [row] = await db
      .insert(reviews)
      .values({
        productId: payload.productId,
        profileId: session.id,
        rating: payload.rating,
        reviewTitle: payload.reviewTitle,
        review: payload.review,
        isVerifiedPurchase: Boolean(purchase),
      })
      .returning();

    const [stats] = await db
      .select({ average: avg(reviews.rating), total: count() })
      .from(reviews)
      .where(eq(reviews.productId, payload.productId));

    await db
      .update(products)
      .set({
        ratingAverage: Number(stats.average ?? 4.5).toFixed(2),
        ratingCount: Number(stats.total ?? 1),
      })
      .where(eq(products.id, payload.productId));

    return created(row);
  });
}
