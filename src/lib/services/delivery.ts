import { asc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { deliverySlots } from "@/db/schema";
import { haversineKm, round2 } from "@/lib/utils";

/** VeggieFlick Chennai Central Hub (Koyambedu wholesale market area). */
export const STORE_LOCATION = { lat: 13.0694, lng: 80.1948, label: "Koyambedu, Chennai" };
export const MAX_RADIUS_KM = 25;
export const FREE_DELIVERY_MIN_ORDER = 499;

const CHARGE_SLABS = [
  { upto: 5, charge: 30 },
  { upto: 10, charge: 50 },
  { upto: 15, charge: 70 },
  { upto: 25, charge: 100 },
];

export function deliveryChargeForDistance(distanceKm: number, subtotal: number): number {
  if (subtotal >= FREE_DELIVERY_MIN_ORDER) return 0;
  const slab = CHARGE_SLABS.find((s) => distanceKm <= s.upto);
  return slab ? slab.charge : 100;
}

export type RadiusCheck = {
  serviceable: boolean;
  distanceKm: number;
  maxRadiusKm: number;
  etaMinutes: number;
  message: string;
};

export function checkRadius(latitude: number, longitude: number): RadiusCheck {
  const distanceKm = haversineKm(STORE_LOCATION, { lat: latitude, lng: longitude });
  const serviceable = distanceKm <= MAX_RADIUS_KM;
  const etaMinutes = Math.max(35, Math.round(20 + distanceKm * 2.4));
  return {
    serviceable,
    distanceKm,
    maxRadiusKm: MAX_RADIUS_KM,
    etaMinutes,
    message: serviceable
      ? `Deliverable in about ${etaMinutes} minutes (${distanceKm} km from our Chennai hub).`
      : `Sorry, this location is ${distanceKm} km away. We currently deliver within ${MAX_RADIUS_KM} km of Chennai.`,
  };
}

/** Estimate distance from a pincode when precise coordinates are unavailable. */
const PINCODE_DISTANCE: Record<string, number> = {
  "600001": 9.4,
  "600002": 8.7,
  "600004": 10.2,
  "600006": 8.1,
  "600017": 5.6,
  "600018": 8.9,
  "600020": 12.4,
  "600024": 2.9,
  "600026": 1.8,
  "600028": 10.8,
  "600032": 6.2,
  "600040": 4.1,
  "600042": 13.6,
  "600049": 15.4,
  "600050": 6.8,
  "600053": 12.1,
  "600056": 11.5,
  "600063": 17.2,
  "600064": 20.1,
  "600073": 21.4,
  "600077": 13.9,
  "600083": 6.4,
  "600087": 9.9,
  "600089": 12.7,
  "600091": 14.8,
  "600095": 18.3,
  "600096": 16.7,
  "600100": 19.6,
  "600119": 22.8,
  "600130": 24.3,
};

export function estimateDistanceFromAddress(input: {
  latitude?: number | null;
  longitude?: number | null;
  postalCode?: string | null;
}): number {
  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    return haversineKm(STORE_LOCATION, { lat: input.latitude, lng: input.longitude });
  }
  if (input.postalCode && PINCODE_DISTANCE[input.postalCode] !== undefined) {
    return PINCODE_DISTANCE[input.postalCode];
  }
  if (input.postalCode?.startsWith("600")) {
    const tail = Number(input.postalCode.slice(3));
    return round2(Math.min(24, 4 + (Number.isFinite(tail) ? tail % 20 : 6)));
  }
  return 30;
}

export async function listDeliverySlots() {
  const rows = await db
    .select()
    .from(deliverySlots)
    .where(eq(deliverySlots.status, "active"))
    .orderBy(asc(deliverySlots.sortOrder));

  return rows.map((slot) => ({
    id: slot.id,
    slotName: slot.slotName,
    startTime: slot.startTime,
    endTime: slot.endTime,
    maximumOrders: slot.maximumOrders,
    bookedOrders: slot.bookedOrders,
    available: slot.bookedOrders < slot.maximumOrders,
  }));
}

export async function getSlot(slotId: string) {
  const [slot] = await db
    .select()
    .from(deliverySlots)
    .where(and(eq(deliverySlots.id, slotId), eq(deliverySlots.status, "active")))
    .limit(1);
  return slot ?? null;
}
