import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts, coupons, inventory, productVariants, products } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { getOrCreateGuestToken, getSession, readGuestToken } from "@/lib/auth";
import { round2, toNumber } from "@/lib/utils";
import { FREE_DELIVERY_MIN_ORDER, deliveryChargeForDistance } from "@/lib/services/delivery";

export type CartLine = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  emoji: string;
  variantName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  taxPercentage: number;
  totalPrice: number;
  availableStock: number;
};

export type CartTotals = {
  subtotal: number;
  savings: number;
  discount: number;
  deliveryCharge: number;
  taxAmount: number;
  grandTotal: number;
  couponCode: string | null;
  freeDeliveryThreshold: number;
  amountToFreeDelivery: number;
};

export type CartSummary = {
  cartId: string;
  items: CartLine[];
  totals: CartTotals;
  itemCount: number;
};

const EMPTY_TOTALS: CartTotals = {
  subtotal: 0,
  savings: 0,
  discount: 0,
  deliveryCharge: 0,
  taxAmount: 0,
  grandTotal: 0,
  couponCode: null,
  freeDeliveryThreshold: FREE_DELIVERY_MIN_ORDER,
  amountToFreeDelivery: FREE_DELIVERY_MIN_ORDER,
};

export const EMPTY_CART: CartSummary = {
  cartId: "",
  items: [],
  totals: EMPTY_TOTALS,
  itemCount: 0,
};

async function findCartRow(create: boolean) {
  const session = await getSession();

  if (session) {
    const [existing] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.profileId, session.id), isNull(carts.deletedAt)))
      .limit(1);
    if (existing) return existing;
    if (!create) return null;
    const [row] = await db.insert(carts).values({ profileId: session.id }).returning();
    return row;
  }

  const token = create ? await getOrCreateGuestToken() : await readGuestToken();
  if (!token) return null;

  const [existing] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.guestToken, token), isNull(carts.profileId)))
    .limit(1);
  if (existing) return existing;
  if (!create) return null;
  const [row] = await db.insert(carts).values({ guestToken: token }).returning();
  return row;
}

export async function loadCartLines(cartId: string): Promise<CartLine[]> {
  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      name: products.name,
      slug: products.slug,
      emoji: products.emoji,
      variantName: productVariants.variantName,
      unit: productVariants.unit,
      sellingPrice: productVariants.sellingPrice,
      mrp: productVariants.mrp,
      taxPercentage: productVariants.taxPercentage,
      availableStock: inventory.availableStock,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .leftJoin(inventory, eq(inventory.variantId, cartItems.variantId))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(cartItems.createdAt);

  return rows.map((row) => {
    const unitPrice = toNumber(row.sellingPrice);
    return {
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      name: row.name,
      slug: row.slug,
      emoji: row.emoji,
      variantName: row.variantName,
      unit: row.unit,
      quantity: row.quantity,
      unitPrice,
      mrp: toNumber(row.mrp),
      taxPercentage: toNumber(row.taxPercentage),
      totalPrice: round2(unitPrice * row.quantity),
      availableStock: row.availableStock ?? 0,
    };
  });
}

export async function validateCoupon(code: string, subtotal: number) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.couponCode, code.toUpperCase()), eq(coupons.status, "active")))
    .limit(1);

  if (!coupon) throw new ApiError("This coupon code is not valid", 404, "COUPON_NOT_FOUND");
  if (coupon.expiryDate.getTime() < Date.now())
    throw new ApiError("This coupon has expired", 400, "COUPON_EXPIRED");
  if (coupon.usedCount >= coupon.usageLimit)
    throw new ApiError("This coupon has reached its usage limit", 400, "COUPON_EXHAUSTED");
  if (subtotal < toNumber(coupon.minimumOrderAmount))
    throw new ApiError(
      `Add items worth ₹${Math.ceil(toNumber(coupon.minimumOrderAmount) - subtotal)} more to use ${coupon.couponCode}`,
      400,
      "COUPON_MIN_ORDER",
    );

  return coupon;
}

export function computeDiscount(
  coupon: { discountType: string; discountValue: string; maximumDiscount: string | null } | null,
  subtotal: number,
): { discount: number; freeDelivery: boolean } {
  if (!coupon) return { discount: 0, freeDelivery: false };
  if (coupon.discountType === "free_delivery") return { discount: 0, freeDelivery: true };
  if (coupon.discountType === "percentage") {
    const raw = (subtotal * toNumber(coupon.discountValue)) / 100;
    const cap = coupon.maximumDiscount ? toNumber(coupon.maximumDiscount) : raw;
    return { discount: round2(Math.min(raw, cap)), freeDelivery: false };
  }
  return { discount: round2(Math.min(toNumber(coupon.discountValue), subtotal)), freeDelivery: false };
}

export function computeTotals(
  items: CartLine[],
  coupon: { discountType: string; discountValue: string; maximumDiscount: string | null } | null,
  couponCode: string | null,
  distanceKm = 6,
): CartTotals {
  const subtotal = round2(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const savings = round2(
    items.reduce((sum, item) => sum + Math.max(0, item.mrp - item.unitPrice) * item.quantity, 0),
  );
  const { discount, freeDelivery } = computeDiscount(coupon, subtotal);
  const taxAmount = round2(
    items.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.taxPercentage) / 100, 0),
  );
  const baseDelivery = items.length === 0 ? 0 : deliveryChargeForDistance(distanceKm, subtotal);
  const deliveryCharge = freeDelivery ? 0 : baseDelivery;
  const grandTotal = round2(Math.max(0, subtotal - discount + deliveryCharge + taxAmount));

  return {
    subtotal,
    savings,
    discount,
    deliveryCharge,
    taxAmount,
    grandTotal,
    couponCode,
    freeDeliveryThreshold: FREE_DELIVERY_MIN_ORDER,
    amountToFreeDelivery: Math.max(0, round2(FREE_DELIVERY_MIN_ORDER - subtotal)),
  };
}

async function persistTotals(cartId: string, totals: CartTotals) {
  await db
    .update(carts)
    .set({
      subtotal: String(totals.subtotal),
      discount: String(totals.discount),
      deliveryCharge: String(totals.deliveryCharge),
      taxAmount: String(totals.taxAmount),
      grandTotal: String(totals.grandTotal),
      couponCode: totals.couponCode,
      updatedAt: new Date(),
    })
    .where(eq(carts.id, cartId));
}

export async function getCartSummary(create = false): Promise<CartSummary> {
  const cart = await findCartRow(create);
  if (!cart) return EMPTY_CART;

  const items = await loadCartLines(cart.id);
  let coupon = null;
  if (cart.couponCode) {
    const [row] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.couponCode, cart.couponCode), eq(coupons.status, "active")))
      .limit(1);
    coupon = row ?? null;
  }

  const subtotalBefore = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const couponUsable = coupon && subtotalBefore >= toNumber(coupon.minimumOrderAmount) ? coupon : null;
  const totals = computeTotals(items, couponUsable, couponUsable?.couponCode ?? null);
  await persistTotals(cart.id, totals);

  return {
    cartId: cart.id,
    items,
    totals,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export async function addToCart(input: { productId: string; variantId: string; quantity: number }) {
  const cart = await findCartRow(true);
  if (!cart) throw new ApiError("Unable to initialise cart", 500, "CART_ERROR");

  const [variant] = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sellingPrice: productVariants.sellingPrice,
      status: productVariants.status,
      availableStock: inventory.availableStock,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(productVariants.id, input.variantId))
    .limit(1);

  if (!variant || variant.status !== "active") throw new ApiError("Product variant unavailable", 404);
  if (variant.productId !== input.productId) throw new ApiError("Variant does not belong to product", 400);

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, input.variantId)))
    .limit(1);

  const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
  const stock = variant.availableStock ?? 0;
  if (nextQuantity > stock) {
    throw new ApiError(
      stock === 0 ? "This item is out of stock" : `Only ${stock} unit(s) left in stock`,
      409,
      "OUT_OF_STOCK",
    );
  }

  const unitPrice = toNumber(variant.sellingPrice);
  if (existing) {
    await db
      .update(cartItems)
      .set({
        quantity: nextQuantity,
        unitPrice: String(unitPrice),
        totalPrice: String(round2(unitPrice * nextQuantity)),
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId: input.productId,
      variantId: input.variantId,
      quantity: input.quantity,
      unitPrice: String(unitPrice),
      totalPrice: String(round2(unitPrice * input.quantity)),
    });
  }

  return getCartSummary(true);
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cart = await findCartRow(false);
  if (!cart) throw new ApiError("Cart is empty", 404, "CART_NOT_FOUND");

  const [item] = await db
    .select({
      id: cartItems.id,
      variantId: cartItems.variantId,
      unitPrice: cartItems.unitPrice,
      availableStock: inventory.availableStock,
    })
    .from(cartItems)
    .leftJoin(inventory, eq(inventory.variantId, cartItems.variantId))
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);

  if (!item) throw new ApiError("Cart item not found", 404, "ITEM_NOT_FOUND");

  if (quantity === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    return getCartSummary(false);
  }

  if (quantity > (item.availableStock ?? 0)) {
    throw new ApiError(`Only ${item.availableStock ?? 0} unit(s) left in stock`, 409, "OUT_OF_STOCK");
  }

  const unitPrice = toNumber(item.unitPrice);
  await db
    .update(cartItems)
    .set({
      quantity,
      totalPrice: String(round2(unitPrice * quantity)),
      updatedAt: new Date(),
    })
    .where(eq(cartItems.id, itemId));

  return getCartSummary(false);
}

export async function removeCartItem(itemId: string) {
  const cart = await findCartRow(false);
  if (!cart) throw new ApiError("Cart is empty", 404, "CART_NOT_FOUND");
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  return getCartSummary(false);
}

export async function clearCart() {
  const cart = await findCartRow(false);
  if (!cart) return EMPTY_CART;
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  await db.update(carts).set({ couponCode: null }).where(eq(carts.id, cart.id));
  return getCartSummary(false);
}

export async function applyCouponToCart(code: string) {
  const summary = await getCartSummary(true);
  if (summary.items.length === 0) throw new ApiError("Your cart is empty", 400, "CART_EMPTY");
  const coupon = await validateCoupon(code, summary.totals.subtotal);
  await db.update(carts).set({ couponCode: coupon.couponCode }).where(eq(carts.id, summary.cartId));
  return getCartSummary(false);
}

export async function removeCouponFromCart() {
  const cart = await findCartRow(false);
  if (!cart) return EMPTY_CART;
  await db.update(carts).set({ couponCode: null }).where(eq(carts.id, cart.id));
  return getCartSummary(false);
}

/** Merge an anonymous cart into the authenticated customer's cart after login. */
export async function mergeGuestCart(profileId: string, guestToken: string | null) {
  if (!guestToken) return;
  const [guestCart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.guestToken, guestToken), isNull(carts.profileId)))
    .limit(1);
  if (!guestCart) return;

  const [userCart] = await db.select().from(carts).where(eq(carts.profileId, profileId)).limit(1);

  if (!userCart) {
    await db
      .update(carts)
      .set({ profileId, guestToken: null, updatedAt: new Date() })
      .where(eq(carts.id, guestCart.id));
    return;
  }

  const guestLines = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));
  for (const line of guestLines) {
    await db
      .insert(cartItems)
      .values({
        cartId: userCart.id,
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
      })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.variantId],
        set: {
          quantity: sql`${cartItems.quantity} + ${line.quantity}`,
          totalPrice: sql`(${cartItems.quantity} + ${line.quantity}) * ${cartItems.unitPrice}`,
          updatedAt: new Date(),
        },
      });
  }
  await db.delete(carts).where(eq(carts.id, guestCart.id));
}
