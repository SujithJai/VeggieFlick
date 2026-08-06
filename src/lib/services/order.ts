import { and, desc, eq, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  addresses,
  cartItems,
  carts,
  coupons,
  deliveryAssignments,
  deliveryPartners,
  deliverySlots,
  inventory,
  notifications,
  orderItems,
  orderTimeline,
  orders,
  payments,
  productVariants,
  products,
  profiles,
  wallets,
  walletTransactions,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import { round2, toNumber } from "@/lib/utils";
import { computeDiscount } from "@/lib/services/cart";
import {
  MAX_RADIUS_KM,
  deliveryChargeForDistance,
  estimateDistanceFromAddress,
} from "@/lib/services/delivery";

export type PlaceOrderInput = {
  addressId: string;
  deliverySlotId: string;
  paymentMethod: "cod" | "upi" | "card" | "netbanking" | "wallet";
  notes?: string;
  idempotencyKey?: string;
};

function generateOrderNumber(): string {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const random = Math.floor(100000 + Math.random() * 900000);
  return `VF${stamp}${random}`;
}

function generateDeliveryOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function placeOrder(profileId: string, input: PlaceOrderInput) {
  return db.transaction(async (tx) => {
    if (input.idempotencyKey) {
      const [existing] = await tx
        .select({ orderId: payments.orderId })
        .from(payments)
        .where(eq(payments.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing) {
        const [order] = await tx.select().from(orders).where(eq(orders.id, existing.orderId)).limit(1);
        if (order) return { order, duplicated: true as const };
      }
    }

    const [cart] = await tx.select().from(carts).where(eq(carts.profileId, profileId)).limit(1);
    if (!cart) throw new ApiError("Your cart is empty", 400, "CART_EMPTY");

    const lines = await tx
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        productName: products.name,
        emoji: products.emoji,
        variantName: productVariants.variantName,
        sellingPrice: productVariants.sellingPrice,
        mrp: productVariants.mrp,
        taxPercentage: productVariants.taxPercentage,
        variantStatus: productVariants.status,
      })
      .from(cartItems)
      .innerJoin(products, eq(products.id, cartItems.productId))
      .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
      .where(eq(cartItems.cartId, cart.id));

    if (lines.length === 0) throw new ApiError("Your cart is empty", 400, "CART_EMPTY");

    const [address] = await tx
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, input.addressId), eq(addresses.profileId, profileId)))
      .limit(1);
    if (!address) throw new ApiError("Delivery address not found", 404, "ADDRESS_NOT_FOUND");

    const distanceKm = estimateDistanceFromAddress(address);
    if (distanceKm > MAX_RADIUS_KM) {
      throw new ApiError(
        `We deliver within ${MAX_RADIUS_KM} km of Chennai. This address is ${distanceKm} km away.`,
        400,
        "OUT_OF_RADIUS",
      );
    }

    const [slot] = await tx
      .select()
      .from(deliverySlots)
      .where(and(eq(deliverySlots.id, input.deliverySlotId), eq(deliverySlots.status, "active")))
      .limit(1);
    if (!slot) throw new ApiError("Delivery slot unavailable", 404, "SLOT_NOT_FOUND");
    if (slot.bookedOrders >= slot.maximumOrders)
      throw new ApiError("This delivery slot is fully booked", 409, "SLOT_FULL");

    // Lock inventory rows to guarantee no overselling under concurrency.
    for (const line of lines) {
      if (line.variantStatus !== "active")
        throw new ApiError(`${line.productName} is no longer available`, 409, "VARIANT_INACTIVE");

      const [stockRow] = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.variantId, line.variantId))
        .for("update")
        .limit(1);

      if (!stockRow || stockRow.availableStock < line.quantity) {
        throw new ApiError(
          `${line.productName} (${line.variantName}) has only ${stockRow?.availableStock ?? 0} unit(s) left`,
          409,
          "OUT_OF_STOCK",
        );
      }
    }

    // Server-authoritative pricing — frontend values are never trusted.
    const subtotal = round2(lines.reduce((sum, l) => sum + toNumber(l.sellingPrice) * l.quantity, 0));
    const taxAmount = round2(
      lines.reduce(
        (sum, l) => sum + (toNumber(l.sellingPrice) * l.quantity * toNumber(l.taxPercentage)) / 100,
        0,
      ),
    );

    let couponRow: typeof coupons.$inferSelect | null = null;
    if (cart.couponCode) {
      const [row] = await tx
        .select()
        .from(coupons)
        .where(and(eq(coupons.couponCode, cart.couponCode), eq(coupons.status, "active")))
        .limit(1);
      if (
        row &&
        row.expiryDate.getTime() > Date.now() &&
        row.usedCount < row.usageLimit &&
        subtotal >= toNumber(row.minimumOrderAmount)
      ) {
        couponRow = row;
      }
    }

    const { discount, freeDelivery } = computeDiscount(couponRow, subtotal);
    const deliveryCharge = freeDelivery ? 0 : deliveryChargeForDistance(distanceKm, subtotal);
    const grandTotal = round2(Math.max(0, subtotal - discount + deliveryCharge + taxAmount));

    const isPrepaid = input.paymentMethod !== "cod";
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        profileId,
        addressId: address.id,
        deliverySlotId: slot.id,
        couponId: couponRow?.id ?? null,
        shippingSnapshot: {
          contactName: address.contactName,
          contactPhone: address.contactPhone,
          line: `${address.doorNo}, ${address.street}, ${address.area}`,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          slot: slot.slotName,
        },
        distanceKm: String(distanceKm),
        subtotal: String(subtotal),
        discount: String(discount),
        deliveryCharge: String(deliveryCharge),
        taxAmount: String(taxAmount),
        grandTotal: String(grandTotal),
        paymentStatus: isPrepaid ? "paid" : "pending",
        orderStatus: "placed",
        deliveryOtp: generateDeliveryOtp(),
        notes: input.notes ?? null,
      })
      .returning();

    await tx.insert(orderItems).values(
      lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        variantId: line.variantId,
        productName: line.productName,
        variantName: line.variantName,
        emoji: line.emoji,
        quantity: line.quantity,
        unitPrice: String(toNumber(line.sellingPrice)),
        totalPrice: String(round2(toNumber(line.sellingPrice) * line.quantity)),
      })),
    );

    for (const line of lines) {
      await tx
        .update(inventory)
        .set({
          availableStock: sql`${inventory.availableStock} - ${line.quantity}`,
          reservedStock: sql`${inventory.reservedStock} + ${line.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.variantId, line.variantId));
    }

    await tx.insert(payments).values({
      orderId: order.id,
      paymentGateway: isPrepaid ? "razorpay" : "cash",
      paymentMethod: input.paymentMethod,
      transactionId: isPrepaid ? `pay_${order.orderNumber.toLowerCase()}` : null,
      razorpayOrderId: isPrepaid ? `order_${order.orderNumber.toLowerCase()}` : null,
      idempotencyKey: input.idempotencyKey ?? `${order.id}-init`,
      paymentStatus: isPrepaid ? "paid" : "pending",
      paidAmount: isPrepaid ? String(grandTotal) : "0",
      paidAt: isPrepaid ? new Date() : null,
    });

    await tx.insert(orderTimeline).values({
      orderId: order.id,
      status: "placed",
      note: isPrepaid ? "Payment received. Order placed successfully." : "Order placed with Cash on Delivery.",
    });

    if (couponRow) {
      await tx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.id, couponRow.id));
    }

    await tx
      .update(deliverySlots)
      .set({ bookedOrders: sql`${deliverySlots.bookedOrders} + 1` })
      .where(eq(deliverySlots.id, slot.id));

    await tx
      .update(profiles)
      .set({ loyaltyPoints: sql`${profiles.loyaltyPoints} + ${Math.floor(grandTotal / 100)}` })
      .where(eq(profiles.id, profileId));

    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await tx
      .update(carts)
      .set({
        couponCode: null,
        subtotal: "0",
        discount: "0",
        deliveryCharge: "0",
        taxAmount: "0",
        grandTotal: "0",
      })
      .where(eq(carts.id, cart.id));

    await tx.insert(notifications).values({
      profileId,
      title: `Order ${order.orderNumber} confirmed`,
      message: `We received your order of ₹${grandTotal.toFixed(2)}. Delivery slot: ${slot.slotName}.`,
      notificationType: "order",
    });

    return { order, duplicated: false as const };
  });
}

export async function listOrders(profileId: string, page = 1, limit = 10) {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      grandTotal: orders.grandTotal,
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}),0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
    })
    .from(orders)
    .where(eq(orders.profileId, profileId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.profileId, profileId));

  return { items: rows, total: Number(total) };
}

export async function getOrderDetail(orderId: string, profileId?: string) {
  const filters = [eq(orders.id, orderId)];
  if (profileId) filters.push(eq(orders.profileId, profileId));

  const [order] = await db
    .select({
      order: orders,
      slotName: deliverySlots.slotName,
      customerName: profiles.fullName,
      customerPhone: profiles.phone,
    })
    .from(orders)
    .leftJoin(deliverySlots, eq(deliverySlots.id, orders.deliverySlotId))
    .innerJoin(profiles, eq(profiles.id, orders.profileId))
    .where(and(...filters))
    .limit(1);

  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const timeline = await db
    .select()
    .from(orderTimeline)
    .where(eq(orderTimeline.orderId, orderId))
    .orderBy(orderTimeline.createdAt);
  const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
  const [assignment] = await db
    .select({
      assignment: deliveryAssignments,
      partnerName: deliveryPartners.fullName,
      partnerPhone: deliveryPartners.phone,
      vehicleNumber: deliveryPartners.vehicleNumber,
      vehicleType: deliveryPartners.vehicleType,
      rating: deliveryPartners.rating,
    })
    .from(deliveryAssignments)
    .leftJoin(deliveryPartners, eq(deliveryPartners.id, deliveryAssignments.deliveryPartnerId))
    .where(eq(deliveryAssignments.orderId, orderId))
    .limit(1);

  return {
    ...order.order,
    slotName: order.slotName,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    items,
    timeline,
    payment: payment ?? null,
    delivery: assignment ?? null,
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;

async function restoreStock(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], orderId: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    await tx
      .update(inventory)
      .set({
        availableStock: sql`${inventory.availableStock} + ${item.quantity}`,
        reservedStock: sql`greatest(0, ${inventory.reservedStock} - ${item.quantity})`,
        updatedAt: new Date(),
      })
      .where(eq(inventory.variantId, item.variantId));
  }
}

export async function cancelOrder(orderId: string, profileId: string, reason?: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.profileId, profileId)))
      .limit(1);
    if (!order) throw new ApiError("Order not found", 404, "ORDER_NOT_FOUND");
    if (!["placed", "confirmed", "packed"].includes(order.orderStatus))
      throw new ApiError("This order can no longer be cancelled", 409, "CANCEL_NOT_ALLOWED");

    await restoreStock(tx, orderId);

    const refundToWallet = order.paymentStatus === "paid";
    await tx
      .update(orders)
      .set({
        orderStatus: "cancelled",
        paymentStatus: refundToWallet ? "refunded" : "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderTimeline).values({
      orderId,
      status: "cancelled",
      note: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer",
    });

    if (refundToWallet) {
      let [wallet] = await tx.select().from(wallets).where(eq(wallets.profileId, profileId)).limit(1);
      if (!wallet) {
        [wallet] = await tx.insert(wallets).values({ profileId, balance: "0" }).returning();
      }
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${order.grandTotal}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        amount: order.grandTotal,
        type: "credit",
        narration: `Refund for order ${order.orderNumber}`,
        referenceOrderId: order.id,
      });
      await tx
        .update(payments)
        .set({ paymentStatus: "refunded", updatedAt: new Date() })
        .where(eq(payments.orderId, orderId));
    }

    await tx.insert(notifications).values({
      profileId,
      title: `Order ${order.orderNumber} cancelled`,
      message: refundToWallet
        ? `₹${toNumber(order.grandTotal).toFixed(2)} has been refunded to your VeggieFlick wallet.`
        : "Your order has been cancelled successfully.",
      notificationType: "order",
    });

    return true;
  });
}

const NEXT_STATUS_NOTE: Record<string, string> = {
  confirmed: "Order confirmed by the Chennai hub.",
  packed: "Your basket is packed and quality checked.",
  out_for_delivery: "Out for delivery. Keep your delivery OTP handy.",
  delivered: "Delivered. Thank you for shopping with VeggieFlick!",
  returned: "Return processed.",
  cancelled: "Order cancelled by VeggieFlick support.",
  placed: "Order placed.",
};

export async function updateOrderStatus(
  orderId: string,
  status: (typeof orders.$inferSelect)["orderStatus"],
  note?: string,
) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new ApiError("Order not found", 404, "ORDER_NOT_FOUND");
    if (order.orderStatus === status) return order;

    if (status === "cancelled" || status === "returned") {
      await restoreStock(tx, orderId);
    }

    if (status === "delivered") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        await tx
          .update(inventory)
          .set({ reservedStock: sql`greatest(0, ${inventory.reservedStock} - ${item.quantity})` })
          .where(eq(inventory.variantId, item.variantId));
        await tx
          .update(products)
          .set({ soldCount: sql`${products.soldCount} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
      await tx
        .update(payments)
        .set({ paymentStatus: "paid", paidAt: new Date(), paidAmount: order.grandTotal })
        .where(eq(payments.orderId, orderId));
    }

    if (status === "out_for_delivery") {
      const [existing] = await tx
        .select()
        .from(deliveryAssignments)
        .where(eq(deliveryAssignments.orderId, orderId))
        .limit(1);
      if (!existing) {
        const [partner] = await tx
          .select()
          .from(deliveryPartners)
          .where(and(eq(deliveryPartners.status, "active"), eq(deliveryPartners.isOnline, true)))
          .limit(1);
        if (partner) {
          await tx.insert(deliveryAssignments).values({
            orderId,
            deliveryPartnerId: partner.id,
            deliveryStatus: "on_the_way",
            pickedAt: new Date(),
          });
        }
      } else {
        await tx
          .update(deliveryAssignments)
          .set({ deliveryStatus: "on_the_way", pickedAt: new Date() })
          .where(eq(deliveryAssignments.orderId, orderId));
      }
    }

    const [updated] = await tx
      .update(orders)
      .set({
        orderStatus: status,
        paymentStatus:
          status === "delivered"
            ? "paid"
            : status === "cancelled"
              ? order.paymentStatus === "paid"
                ? "refunded"
                : "cancelled"
              : order.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderTimeline).values({
      orderId,
      status,
      note: note ?? NEXT_STATUS_NOTE[status] ?? "Status updated",
    });

    await tx.insert(notifications).values({
      profileId: order.profileId,
      title: `Order ${order.orderNumber} — ${status.replace(/_/g, " ")}`,
      message: note ?? NEXT_STATUS_NOTE[status] ?? "Your order status has been updated.",
      notificationType: status === "delivered" ? "delivery" : "order",
    });

    return updated;
  });
}

export async function reorder(orderId: string, profileId: string) {
  const items = await db
    .select({ productId: orderItems.productId, variantId: orderItems.variantId, quantity: orderItems.quantity })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orderItems.orderId, orderId), eq(orders.profileId, profileId)));

  if (items.length === 0) throw new ApiError("Order not found", 404, "ORDER_NOT_FOUND");
  return items;
}
