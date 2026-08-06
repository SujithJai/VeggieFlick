import { handle, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import {
  getCustomerSegments,
  getDashboardStats,
  getInventoryAlerts,
  getRecentOrders,
  getRevenueTrend,
  getTopProducts,
} from "@/lib/services/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requirePermission("analytics.read");
    const [stats, trend, topProducts, alerts, recentOrders, segments] = await Promise.all([
      getDashboardStats(),
      getRevenueTrend(7),
      getTopProducts(6),
      getInventoryAlerts(8),
      getRecentOrders(8),
      getCustomerSegments(),
    ]);
    return ok({ stats, trend, topProducts, alerts, recentOrders, segments });
  });
}
