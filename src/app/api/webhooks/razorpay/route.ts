import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, orderTimeline, orders, payments } from "@/db/schema";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

type RazorpayEvent = {
  event: string;
  payload?: {
    payment?: {
      entity?: { id?: string; order_id?: string; amount?: number; notes?: { orderId?: string } };
    };
  };
};

function verifySignature(raw: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_SECRET;
  if (!secret) return false;
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifySignature(raw, signature)) {
    return fail("Invalid webhook signature", 401, "INVALID_SIGNATURE");
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(raw) as RazorpayEvent;
  } catch {
    return fail("Invalid webhook payload", 400, "INVALID_JSON");
  }

  const entity = event.payload?.payment?.entity;
  const internalOrderId = entity?.notes?.orderId;
  if (!internalOrderId) return ok({ ignored: true });

  const paid = event.event === "payment.captured";
  await db
    .update(payments)
    .set({
      paymentStatus: paid ? "paid" : "failed",
      transactionId: entity?.id ?? null,
      razorpayOrderId: entity?.order_id ?? null,
      paidAmount: paid ? String((entity?.amount ?? 0) / 100) : "0",
      paidAt: paid ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.orderId, internalOrderId));

  await db
    .update(orders)
    .set({ paymentStatus: paid ? "paid" : "failed", updatedAt: new Date() })
    .where(eq(orders.id, internalOrderId));

  if (paid) {
    await db.insert(orderTimeline).values({
      orderId: internalOrderId,
      status: "confirmed",
      note: "Payment captured via Razorpay webhook.",
    });
  }

  await db.insert(auditLogs).values({
    action: `webhook.${event.event}`,
    entity: "payment",
    entityId: internalOrderId,
    metadata: { paid },
  });

  return ok({ received: true });
}
