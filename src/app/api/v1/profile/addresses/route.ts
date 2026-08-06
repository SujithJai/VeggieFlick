import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { ApiError, created, handle, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { estimateDistanceFromAddress, MAX_RADIUS_KM } from "@/lib/services/delivery";
import { addressSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await requireUser();
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.profileId, session.id))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
    return ok(
      rows.map((address) => {
        const distanceKm = estimateDistanceFromAddress(address);
        return { ...address, distanceKm, serviceable: distanceKm <= MAX_RADIUS_KM };
      }),
    );
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const payload = await parseBody(request, addressSchema);

    const distanceKm = estimateDistanceFromAddress(payload);
    if (distanceKm > MAX_RADIUS_KM) {
      throw new ApiError(
        `We currently deliver within ${MAX_RADIUS_KM} km of Chennai. This address is about ${distanceKm} km away.`,
        400,
        "OUT_OF_RADIUS",
      );
    }

    if (payload.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.profileId, session.id));
    }

    const [row] = await db
      .insert(addresses)
      .values({ ...payload, profileId: session.id })
      .returning();

    return created({ ...row, distanceKm, serviceable: true });
  });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const url = new URL(request.url);
    const parsed = deleteSchema.safeParse({ id: url.searchParams.get("id") ?? "" });
    if (!parsed.success) throw new ApiError("Invalid address id", 422, "VALIDATION_ERROR");

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, parsed.data.id), eq(addresses.profileId, session.id)));
    return ok({ deleted: true });
  });
}
