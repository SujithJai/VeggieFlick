import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { inventory, productVariants, products, wishlists } from "@/db/schema";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await requireUser();
    const rows = await db
      .select({
        id: wishlists.id,
        productId: products.id,
        name: products.name,
        slug: products.slug,
        emoji: products.emoji,
        shortDescription: products.shortDescription,
        variantId: productVariants.id,
        variantName: productVariants.variantName,
        price: productVariants.sellingPrice,
        mrp: productVariants.mrp,
        availableStock: inventory.availableStock,
      })
      .from(wishlists)
      .innerJoin(products, eq(products.id, wishlists.productId))
      .innerJoin(
        productVariants,
        and(eq(productVariants.productId, products.id), eq(productVariants.isDefault, true)),
      )
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(eq(wishlists.profileId, session.id))
      .orderBy(desc(wishlists.createdAt));
    return ok(rows);
  });
}

const toggleSchema = z.object({ productId: z.string().uuid(), variantId: z.string().uuid().optional() });

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { productId, variantId } = await parseBody(request, toggleSchema);

    const [existing] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.profileId, session.id), eq(wishlists.productId, productId)))
      .limit(1);

    if (existing) {
      await db.delete(wishlists).where(eq(wishlists.id, existing.id));
      return ok({ saved: false });
    }

    await db.insert(wishlists).values({ profileId: session.id, productId, variantId: variantId ?? null });
    return ok({ saved: true });
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError("Wishlist id is required", 422, "VALIDATION_ERROR");
    await db.delete(wishlists).where(and(eq(wishlists.id, id), eq(wishlists.profileId, session.id)));
    return ok({ deleted: true });
  });
}
