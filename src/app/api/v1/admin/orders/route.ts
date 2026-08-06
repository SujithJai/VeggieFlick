import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, orders, profiles } from "@/db/schema";
import { handle, ok, paginationMeta, parseBody, parseQuery } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/services/order";
import { adminOrderUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z
    .enum(["placed", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled", "returned"])
    .optional(),
});

export async function GET(request: Request) {
  return handle(async () => {
    await requirePermission("orders.read");
    const { page, limit, status } = parseQuery(request, querySchema);
    const where = status ? eq(orders.orderStatus, status) : undefined;

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: profiles.fullName,
        customerPhone: profiles.phone,
        grandTotal: orders.grandTotal,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(profiles, eq(profiles.id, orders.profileId))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const [{ value: total }] = await db.select({ value: count() }).from(orders).where(where);
    return ok(rows, paginationMeta(page, limit, Number(total)));
  });
}

const patchSchema = adminOrderUpdateSchema.extend({ orderId: z.string().uuid() });

export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await requirePermission("orders.update");
    const { orderId, orderStatus, note } = await parseBody(request, patchSchema);
    const updated = await updateOrderStatus(orderId, orderStatus, note);

    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "order.status.update",
      entity: "order",
      entityId: orderId,
      metadata: { orderStatus, note: note ?? null },
    });

    return ok(updated);
  });
}

const assignSchema = z.object({ orderId: z.string().uuid() });

export async function POST(request: Request) {
  return handle(async () => {
    await requirePermission("orders.update");
    const { orderId } = await parseBody(request, assignSchema);
    const updated = await updateOrderStatus(orderId, "out_for_delivery");
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return ok({ updated, deliveryOtp: order?.deliveryOtp ?? null });
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    const session = await requirePermission("orders.update");
    const orderId = new URL(request.url).searchParams.get("orderId") ?? "";
    const updated = await updateOrderStatus(orderId, "cancelled", "Cancelled by VeggieFlick operations.");
    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "order.cancel",
      entity: "order",
      entityId: orderId,
    });
    return ok(updated);
  });
}

export const runtime = "nodejs";
