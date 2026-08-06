import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, coupons } from "@/db/schema";
import { ApiError, created, handle, ok, parseBody } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { couponCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requirePermission("coupons.*");
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return ok(rows);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requirePermission("coupons.*");
    const payload = await parseBody(request, couponCreateSchema);

    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.couponCode, payload.couponCode))
      .limit(1);
    if (existing) throw new ApiError("This coupon code already exists", 409, "DUPLICATE_COUPON");

    const [row] = await db
      .insert(coupons)
      .values({
        couponCode: payload.couponCode,
        title: payload.title,
        discountType: payload.discountType,
        discountValue: payload.discountValue.toFixed(2),
        minimumOrderAmount: payload.minimumOrderAmount.toFixed(2),
        maximumDiscount: payload.maximumDiscount ? payload.maximumDiscount.toFixed(2) : null,
        usageLimit: payload.usageLimit,
        expiryDate: new Date(Date.now() + payload.expiryDays * 24 * 60 * 60 * 1000),
      })
      .returning();

    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "coupon.create",
      entity: "coupon",
      entityId: row.id,
      metadata: { code: row.couponCode },
    });

    return created(row);
  });
}

const toggleSchema = z.object({ id: z.string().uuid(), status: z.enum(["active", "inactive"]) });

export async function PATCH(request: Request) {
  return handle(async () => {
    await requirePermission("coupons.*");
    const { id, status } = await parseBody(request, toggleSchema);
    const [row] = await db
      .update(coupons)
      .set({ status, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    if (!row) throw new ApiError("Coupon not found", 404, "NOT_FOUND");
    return ok(row);
  });
}
