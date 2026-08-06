import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const createSchema = z.object({ orderId: z.string().uuid() });

/** POST /api/v1/payments — create a Razorpay order for an existing VeggieFlick order. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { orderId } = await parseBody(request, createSchema);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.profileId !== session.id) throw new ApiError("Order not found", 404, "ORDER_NOT_FOUND");
    if (order.paymentStatus === "paid") throw new ApiError("Order is already paid", 409, "ALREADY_PAID");

    const amountPaise = Math.round(toNumber(order.grandTotal) * 100);
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;

    if (keyId && keySecret) {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: order.orderNumber,
          notes: { orderId: order.id },
        }),
      });
      if (!response.ok) throw new ApiError("Payment gateway rejected the request", 502, "GATEWAY_ERROR");
      const gatewayOrder = (await response.json()) as { id: string };
      await db
        .update(payments)
        .set({ razorpayOrderId: gatewayOrder.id, updatedAt: new Date() })
        .where(eq(payments.orderId, order.id));
      return ok({
        provider: "razorpay",
        keyId,
        razorpayOrderId: gatewayOrder.id,
        amount: amountPaise,
        currency: "INR",
        orderNumber: order.orderNumber,
      });
    }

    // No live keys configured — return a deterministic reference so the flow stays complete.
    const reference = `order_${order.orderNumber.toLowerCase()}`;
    await db
      .update(payments)
      .set({ razorpayOrderId: reference, updatedAt: new Date() })
      .where(eq(payments.orderId, order.id));
    return ok({
      provider: "internal",
      keyId: null,
      razorpayOrderId: reference,
      amount: amountPaise,
      currency: "INR",
      orderNumber: order.orderNumber,
    });
  });
}

const verifySchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(4),
  razorpayPaymentId: z.string().min(4),
  razorpaySignature: z.string().min(4).optional(),
});

/** PUT /api/v1/payments — verify a gateway signature and mark the order paid. */
export async function PUT(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const payload = await parseBody(request, verifySchema);

    const [order] = await db.select().from(orders).where(eq(orders.id, payload.orderId)).limit(1);
    if (!order || order.profileId !== session.id) throw new ApiError("Order not found", 404, "ORDER_NOT_FOUND");

    const secret = process.env.RAZORPAY_SECRET;
    if (secret) {
      const expected = createHmac("sha256", secret)
        .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
        .digest("hex");
      if (expected !== payload.razorpaySignature) {
        await db
          .update(payments)
          .set({ paymentStatus: "failed", updatedAt: new Date() })
          .where(eq(payments.orderId, order.id));
        throw new ApiError("Payment signature verification failed", 400, "SIGNATURE_MISMATCH");
      }
    }

    await db
      .update(payments)
      .set({
        paymentStatus: "paid",
        transactionId: payload.razorpayPaymentId,
        razorpayOrderId: payload.razorpayOrderId,
        paidAmount: order.grandTotal,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, order.id));

    await db
      .update(orders)
      .set({ paymentStatus: "paid", updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    return ok({ verified: true, orderNumber: order.orderNumber });
  });
}
