import { and, count, desc, eq, gte, sql, sum, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  coupons,
  inventory,
  orderItems,
  orders,
  productVariants,
  products,
  profiles,
} from "@/db/schema";
import { toNumber } from "@/lib/utils";

function startOfTodayIST(): Date {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
}

export type DashboardStats = {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  newCustomers: number;
  lowStockItems: number;
  outOfStockItems: number;
  deliveryInProgress: number;
  activeCoupons: number;
  lifetimeRevenue: number;
  averageOrderValue: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = startOfTodayIST();

  const [today] = await db
    .select({ revenue: sum(orders.grandTotal), orders: count() })
    .from(orders)
    .where(and(gte(orders.createdAt, todayStart), ne(orders.orderStatus, "cancelled")));

  const [lifetime] = await db
    .select({ revenue: sum(orders.grandTotal), orders: count() })
    .from(orders)
    .where(ne(orders.orderStatus, "cancelled"));

  const [statusRow] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${orders.orderStatus} in ('placed','confirmed','packed'))`,
      completed: sql<number>`count(*) filter (where ${orders.orderStatus} = 'delivered')`,
      cancelled: sql<number>`count(*) filter (where ${orders.orderStatus} in ('cancelled','returned'))`,
      inTransit: sql<number>`count(*) filter (where ${orders.orderStatus} = 'out_for_delivery')`,
    })
    .from(orders);

  const [customerRow] = await db
    .select({ value: count() })
    .from(profiles)
    .where(and(eq(profiles.role, "customer"), gte(profiles.createdAt, todayStart)));

  const [stockRow] = await db
    .select({
      low: sql<number>`count(*) filter (where ${inventory.availableStock} > 0 and ${inventory.availableStock} <= ${inventory.reorderLevel})`,
      out: sql<number>`count(*) filter (where ${inventory.availableStock} = 0)`,
    })
    .from(inventory);

  const [couponRow] = await db
    .select({ value: count() })
    .from(coupons)
    .where(and(eq(coupons.status, "active"), gte(coupons.expiryDate, new Date())));

  const lifetimeRevenue = toNumber(lifetime?.revenue ?? 0);
  const lifetimeOrders = Number(lifetime?.orders ?? 0);

  return {
    todayRevenue: toNumber(today?.revenue ?? 0),
    todayOrders: Number(today?.orders ?? 0),
    pendingOrders: Number(statusRow?.pending ?? 0),
    completedOrders: Number(statusRow?.completed ?? 0),
    cancelledOrders: Number(statusRow?.cancelled ?? 0),
    newCustomers: Number(customerRow?.value ?? 0),
    lowStockItems: Number(stockRow?.low ?? 0),
    outOfStockItems: Number(stockRow?.out ?? 0),
    deliveryInProgress: Number(statusRow?.inTransit ?? 0),
    activeCoupons: Number(couponRow?.value ?? 0),
    lifetimeRevenue,
    averageOrderValue: lifetimeOrders ? Math.round(lifetimeRevenue / lifetimeOrders) : 0,
  };
}

export async function getRevenueTrend(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`,
      revenue: sum(orders.grandTotal),
      orders: count(),
    })
    .from(orders)
    .where(and(gte(orders.createdAt, since), ne(orders.orderStatus, "cancelled")))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return rows.map((row) => ({
    day: row.day,
    revenue: toNumber(row.revenue ?? 0),
    orders: Number(row.orders ?? 0),
  }));
}

export async function getTopProducts(limit = 6) {
  const rows = await db
    .select({
      productId: orderItems.productId,
      name: orderItems.productName,
      emoji: orderItems.emoji,
      units: sum(orderItems.quantity),
      revenue: sum(orderItems.totalPrice),
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.productName, orderItems.emoji)
    .orderBy(desc(sum(orderItems.totalPrice)))
    .limit(limit);

  if (rows.length > 0) {
    return rows.map((r) => ({
      name: r.name,
      emoji: r.emoji,
      units: Number(r.units ?? 0),
      revenue: toNumber(r.revenue ?? 0),
    }));
  }

  const fallback = await db
    .select({
      name: products.name,
      emoji: products.emoji,
      units: products.soldCount,
      price: productVariants.sellingPrice,
    })
    .from(products)
    .innerJoin(
      productVariants,
      and(eq(productVariants.productId, products.id), eq(productVariants.isDefault, true)),
    )
    .orderBy(desc(products.soldCount))
    .limit(limit);

  return fallback.map((r) => ({
    name: r.name,
    emoji: r.emoji,
    units: r.units,
    revenue: Math.round(r.units * toNumber(r.price)),
  }));
}

export async function getInventoryAlerts(limit = 8) {
  return db
    .select({
      variantId: productVariants.id,
      productName: products.name,
      emoji: products.emoji,
      variantName: productVariants.variantName,
      availableStock: inventory.availableStock,
      reorderLevel: inventory.reorderLevel,
      warehouseName: inventory.warehouseName,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(lte(inventory.availableStock, inventory.reorderLevel))
    .orderBy(inventory.availableStock)
    .limit(limit);
}

export async function getRecentOrders(limit = 8) {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: profiles.fullName,
      grandTotal: orders.grandTotal,
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(profiles, eq(profiles.id, orders.profileId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getCustomerSegments() {
  const [row] = await db
    .select({
      total: count(),
      gold: sql<number>`count(*) filter (where ${profiles.loyaltyTier} = 'Gold')`,
      platinum: sql<number>`count(*) filter (where ${profiles.loyaltyTier} = 'Platinum')`,
    })
    .from(profiles)
    .where(eq(profiles.role, "customer"));
  return {
    total: Number(row?.total ?? 0),
    gold: Number(row?.gold ?? 0),
    platinum: Number(row?.platinum ?? 0),
  };
}
