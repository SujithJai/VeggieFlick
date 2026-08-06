import { and, count, desc, eq, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  auditLogs,
  categories,
  inventory,
  productVariants,
  products,
} from "@/db/schema";
import { ApiError, created, handle, ok, paginationMeta, parseBody, parseQuery } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { inventoryUpdateSchema, productCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  view: z.enum(["products", "inventory"]).default("products"),
});

export async function GET(request: Request) {
  return handle(async () => {
    await requirePermission("inventory.read");
    const { page, limit, view } = parseQuery(request, querySchema);
    const offset = (page - 1) * limit;

    if (view === "inventory") {
      const rows = await db
        .select({
          variantId: productVariants.id,
          productName: products.name,
          emoji: products.emoji,
          variantName: productVariants.variantName,
          sku: products.sku,
          availableStock: inventory.availableStock,
          reservedStock: inventory.reservedStock,
          reorderLevel: inventory.reorderLevel,
          warehouseName: inventory.warehouseName,
        })
        .from(inventory)
        .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
        .innerJoin(products, eq(products.id, productVariants.productId))
        .orderBy(inventory.availableStock)
        .limit(limit)
        .offset(offset);

      const [{ value: total }] = await db.select({ value: count() }).from(inventory);
      return ok(rows, paginationMeta(page, limit, Number(total)));
    }

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        emoji: products.emoji,
        status: products.status,
        categoryName: categories.name,
        isOrganic: products.isOrganic,
        isFeatured: products.isFeatured,
        price: productVariants.sellingPrice,
        mrp: productVariants.mrp,
        stock: inventory.availableStock,
      })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .innerJoin(
        productVariants,
        and(eq(productVariants.productId, products.id), eq(productVariants.isDefault, true)),
      )
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ value: total }] = await db.select({ value: count() }).from(products);
    return ok(rows, paginationMeta(page, limit, Number(total)));
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requirePermission("products.*");
    const payload = await parseBody(request, productCreateSchema);
    if (payload.sellingPrice > payload.mrp)
      throw new ApiError("Selling price cannot exceed MRP", 422, "INVALID_PRICE");

    const slug = slugify(payload.name);
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (existing) throw new ApiError("A product with this name already exists", 409, "DUPLICATE_PRODUCT");

    const [{ value: total }] = await db.select({ value: count() }).from(products);
    const discount = Math.round(((payload.mrp - payload.sellingPrice) / payload.mrp) * 100);

    const [product] = await db
      .insert(products)
      .values({
        categoryId: payload.categoryId,
        name: payload.name,
        slug,
        sku: `VF-${String(Number(total) + 1).padStart(4, "0")}`,
        emoji: payload.emoji,
        shortDescription: payload.shortDescription,
        description: payload.description,
        origin: payload.origin ?? "Tamil Nadu",
        isOrganic: payload.isOrganic,
        isFeatured: payload.isFeatured,
        seoTitle: `Buy ${payload.name} Online in Chennai | VeggieFlick`,
        seoDescription: payload.shortDescription,
      })
      .returning();

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId: product.id,
        variantName: payload.variantName,
        weight: String(payload.weight),
        unit: payload.unit,
        mrp: payload.mrp.toFixed(2),
        sellingPrice: payload.sellingPrice.toFixed(2),
        costPrice: (payload.sellingPrice * 0.72).toFixed(2),
        discountPercentage: discount.toFixed(2),
        isDefault: true,
      })
      .returning();

    await db.insert(inventory).values({
      variantId: variant.id,
      availableStock: payload.availableStock,
    });

    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "product.create",
      entity: "product",
      entityId: product.id,
      metadata: { name: product.name },
    });

    return created({ product, variant });
  });
}

export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await requirePermission("inventory.update");
    const payload = await parseBody(request, inventoryUpdateSchema);

    const [row] = await db
      .update(inventory)
      .set({
        availableStock: payload.availableStock,
        ...(payload.reorderLevel !== undefined ? { reorderLevel: payload.reorderLevel } : {}),
        updatedAt: new Date(),
      })
      .where(eq(inventory.variantId, payload.variantId))
      .returning();

    if (!row) throw new ApiError("Inventory record not found", 404, "NOT_FOUND");

    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "inventory.update",
      entity: "inventory",
      entityId: payload.variantId,
      metadata: { availableStock: payload.availableStock },
    });

    return ok(row);
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    const session = await requirePermission("products.*");
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const [row] = await db
      .update(products)
      .set({ status: "inactive", deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    if (!row) throw new ApiError("Product not found", 404, "NOT_FOUND");
    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "product.archive",
      entity: "product",
      entityId: id,
    });
    return ok({ archived: true });
  });
}

export async function PUT() {
  return handle(async () => {
    await requirePermission("inventory.read");
    const rows = await db
      .select({
        variantId: productVariants.id,
        productName: products.name,
        availableStock: inventory.availableStock,
        reorderLevel: inventory.reorderLevel,
      })
      .from(inventory)
      .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(lte(inventory.availableStock, inventory.reorderLevel))
      .orderBy(inventory.availableStock);
    return ok(rows);
  });
}
