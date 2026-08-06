import { z } from "zod";
import { handle, notFound, ok, parseQuery } from "@/lib/api";
import { getSession, BACK_OFFICE_ROLES } from "@/lib/auth";
import { checkRadius, listDeliverySlots, MAX_RADIUS_KM, STORE_LOCATION } from "@/lib/services/delivery";
import { getOrderDetail } from "@/lib/services/order";
import { radiusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  resource: z.enum(["slots", "radius", "track"]).default("slots"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  orderId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  return handle(async () => {
    const query = parseQuery(request, querySchema);

    if (query.resource === "radius") {
      const { latitude, longitude } = radiusSchema.parse({
        latitude: query.latitude,
        longitude: query.longitude,
      });
      return ok({ ...checkRadius(latitude, longitude), hub: STORE_LOCATION });
    }

    if (query.resource === "track") {
      const session = await getSession();
      if (!session || !query.orderId) return notFound("Order not found");
      const staff = BACK_OFFICE_ROLES.includes(session.role);
      const order = await getOrderDetail(query.orderId, staff ? undefined : session.id);
      if (!order) return notFound("Order not found");
      return ok({
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        timeline: order.timeline,
        delivery: order.delivery,
        deliveryOtp: order.orderStatus === "out_for_delivery" ? order.deliveryOtp : null,
        hub: STORE_LOCATION,
      });
    }

    return ok({ slots: await listDeliverySlots(), maxRadiusKm: MAX_RADIUS_KM, hub: STORE_LOCATION });
  });
}
