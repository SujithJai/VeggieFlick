import { and, asc, desc, eq, gte, ilike, lte, ne, or, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  inventory,
  productImages,
  productVariants,
  products,
  reviews,
  profiles,
  subCategories,
} from "@/db/schema";
import type { ProductQuery } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

export type ProductCard = {
  id: string;
  name: string;
  tamilName: string | null;
  slug: string;
  emoji: string;
  shortDescription: string | null;
  isOrganic: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isFreshToday: boolean;
  isCutVegetable: boolean;
  rating: number;
  ratingCount: number;
  soldCount: number;
  categoryName: string;
  categorySlug: string;
  variantId: string;
  variantName: string;
  unit: string;
  mrp: number;
  price: number;
  discountPercentage: number;
  availableStock: number;
};

const cardColumns = {
  id: products.id,
  name: products.name,
  tamilName: products.tamilName,
  slug: products.slug,
  emoji: products.emoji,
  shortDescription: products.shortDescription,
  isOrganic: products.isOrganic,
  isBestSeller: products.isBestSeller,
  isFeatured: products.isFeatured,
  isFreshToday: products.isFreshToday,
  isCutVegetable: products.isCutVegetable,
  rating: products.ratingAverage,
  ratingCount: products.ratingCount,
  soldCount: products.soldCount,
  createdAt: products.createdAt,
  categoryName: categories.name,
  categorySlug: categories.slug,
  variantId: productVariants.id,
  variantName: productVariants.variantName,
  unit: productVariants.unit,
  mrp: productVariants.mrp,
  price: productVariants.sellingPrice,
  discountPercentage: productVariants.discountPercentage,
  availableStock: inventory.availableStock,
};

type CardRow = {
  id: string;
  name: string;
  tamilName: string | null;
  slug: string;
  emoji: string;
  shortDescription: string | null;
  isOrganic: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isFreshToday: boolean;
  isCutVegetable: boolean;
  rating: string;
  ratingCount: number;
  soldCount: number;
  categoryName: string;
  categorySlug: string;
  variantId: string;
  variantName: string;
  unit: string;
  mrp: string;
  price: string;
  discountPercentage: string;
  availableStock: number | null;
};

function mapCard(row: CardRow): ProductCard {
  return {
    id: row.id,
    name: row.name,
    tamilName: row.tamilName,
    slug: row.slug,
    emoji: row.emoji,
    shortDescription: row.shortDescription,
    isOrganic: row.isOrganic,
    isBestSeller: row.isBestSeller,
    isFeatured: row.isFeatured,
    isFreshToday: row.isFreshToday,
    isCutVegetable: row.isCutVegetable,
    rating: toNumber(row.rating, 4.5),
    ratingCount: row.ratingCount,
    soldCount: row.soldCount,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    variantId: row.variantId,
    variantName: row.variantName,
    unit: row.unit,
    mrp: toNumber(row.mrp),
    price: toNumber(row.price),
    discountPercentage: toNumber(row.discountPercentage),
    availableStock: row.availableStock ?? 0,
  };
}

function buildFilters(query: Partial<ProductQuery>) {
  const filters = [eq(products.status, "active"), eq(productVariants.status, "active")];

  if (query.category) filters.push(eq(categories.slug, query.category));
  if (query.subCategory) filters.push(eq(subCategories.slug, query.subCategory));
  if (query.search) {
    const term = `%${query.search}%`;
    const searchClause = or(
      ilike(products.name, term),
      ilike(products.tamilName, term),
      ilike(products.sku, term),
      ilike(products.shortDescription, term),
      ilike(categories.name, term),
    );
    if (searchClause) filters.push(searchClause);
  }
  if (query.minPrice !== undefined) filters.push(gte(productVariants.sellingPrice, String(query.minPrice)));
  if (query.maxPrice !== undefined) filters.push(lte(productVariants.sellingPrice, String(query.maxPrice)));
  if (query.organic === "true") filters.push(eq(products.isOrganic, true));
  if (query.bestSeller === "true") filters.push(eq(products.isBestSeller, true));
  if (query.featured === "true") filters.push(eq(products.isFeatured, true));
  if (query.freshToday === "true") filters.push(eq(products.isFreshToday, true));
  if (query.cut === "true") filters.push(eq(products.isCutVegetable, true));
  if (query.inStock === "true") filters.push(gte(inventory.availableStock, 1));
  if (query.minDiscount !== undefined)
    filters.push(gte(productVariants.discountPercentage, String(query.minDiscount)));
  if (query.minRating !== undefined) filters.push(gte(products.ratingAverage, String(query.minRating)));

  return and(...filters);
}

function orderClause(sort: ProductQuery["sort"]) {
  switch (sort) {
    case "newest":
      return [desc(products.createdAt)];
    case "price_asc":
      return [asc(productVariants.sellingPrice)];
    case "price_desc":
      return [desc(productVariants.sellingPrice)];
    case "discount":
      return [desc(productVariants.discountPercentage)];
    case "rating":
      return [desc(products.ratingAverage), desc(products.ratingCount)];
    default:
      return [desc(products.soldCount), desc(products.isBestSeller)];
  }
}

export async function listProducts(query: ProductQuery) {
  const where = buildFilters(query);
  const offset = (query.page - 1) * query.limit;

  const rows = await db
    .select(cardColumns)
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(subCategories, eq(subCategories.id, products.subCategoryId))
    .innerJoin(
      productVariants,
      and(eq(productVariants.productId, products.id), eq(productVariants.isDefault, true)),
    )
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(where)
    .orderBy(...orderClause(query.sort))
    .limit(query.limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(subCategories, eq(subCategories.id, products.subCategoryId))
    .innerJoin(
      productVariants,
      and(eq(productVariants.productId, products.id), eq(productVariants.isDefault, true)),
    )
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(where);

  return { items: rows.map(mapCard), total: Number(total) };
}

export async function listCollection(
  filter: Partial<ProductQuery>,
  limit = 8,
  sort: ProductQuery["sort"] = "popularity",
): Promise<ProductCard[]> {
  const { items } = await listProducts({
    page: 1,
    limit,
    sort,
    ...filter,
  } as ProductQuery);
  return items;
}

export async function listCategories() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      tamilName: categories.tamilName,
      icon: categories.icon,
      accent: categories.accent,
      description: categories.description,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(eq(categories.status, "active"))
    .orderBy(asc(categories.sortOrder));
}

export async function listSubCategories(categorySlug?: string) {
  const filters = [eq(subCategories.status, "active")];
  if (categorySlug) filters.push(eq(categories.slug, categorySlug));
  return db
    .select({
      id: subCategories.id,
      name: subCategories.name,
      slug: subCategories.slug,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(subCategories)
    .innerJoin(categories, eq(categories.id, subCategories.categoryId))
    .where(and(...filters))
    .orderBy(asc(subCategories.sortOrder));
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.status, "active")))
    .limit(1);
  return row ?? null;
}

export async function getProductBySlug(slug: string) {
  const [row] = await db
    .select({
      product: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);

  if (!row) return null;

  const variants = await db
    .select({
      id: productVariants.id,
      variantName: productVariants.variantName,
      weight: productVariants.weight,
      unit: productVariants.unit,
      mrp: productVariants.mrp,
      sellingPrice: productVariants.sellingPrice,
      discountPercentage: productVariants.discountPercentage,
      taxPercentage: productVariants.taxPercentage,
      isDefault: productVariants.isDefault,
      availableStock: inventory.availableStock,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(and(eq(productVariants.productId, row.product.id), eq(productVariants.status, "active")))
    .orderBy(asc(productVariants.sellingPrice));

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.product.id))
    .orderBy(asc(productImages.displayOrder));

  const productReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      reviewTitle: reviews.reviewTitle,
      review: reviews.review,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      createdAt: reviews.createdAt,
      authorName: profiles.fullName,
    })
    .from(reviews)
    .innerJoin(profiles, eq(profiles.id, reviews.profileId))
    .where(eq(reviews.productId, row.product.id))
    .orderBy(desc(reviews.createdAt))
    .limit(12);

  return {
    ...row.product,
    ratingAverageNumber: toNumber(row.product.ratingAverage, 4.5),
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    categoryIcon: row.categoryIcon,
    variants: variants.map((v) => ({
      id: v.id,
      variantName: v.variantName,
      weight: toNumber(v.weight),
      unit: v.unit,
      mrp: toNumber(v.mrp),
      sellingPrice: toNumber(v.sellingPrice),
      discountPercentage: toNumber(v.discountPercentage),
      taxPercentage: toNumber(v.taxPercentage),
      isDefault: v.isDefault,
      availableStock: v.availableStock ?? 0,
    })),
    images,
    reviews: productReviews,
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(categorySlug: string, excludeId: string, limit = 6) {
  const rows = await db
    .select(cardColumns)
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(
      productVariants,
      and(eq(productVariants.productId, products.id), eq(productVariants.isDefault, true)),
    )
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(
      and(eq(products.status, "active"), eq(categories.slug, categorySlug), ne(products.id, excludeId)),
    )
    .orderBy(desc(products.soldCount))
    .limit(limit);
  return rows.map(mapCard);
}

export async function searchSuggestions(term: string, limit = 8) {
  if (!term.trim()) return [];
  const like = `%${term.trim()}%`;
  return db
    .select({
      name: products.name,
      slug: products.slug,
      emoji: products.emoji,
      categoryName: categories.name,
      price: productVariants.sellingPrice,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(
      productVariants,
      and(eq(productVariants.productId, products.id), eq(productVariants.isDefault, true)),
    )
    .where(
      and(
        eq(products.status, "active"),
        or(
          ilike(products.name, like),
          ilike(products.tamilName, like),
          ilike(products.sku, like),
          ilike(categories.name, like),
        ),
      ),
    )
    .orderBy(desc(products.soldCount))
    .limit(limit);
}

export async function catalogCounts() {
  const [row] = await db
    .select({
      productCount: count(products.id),
      organicCount: sql<number>`count(*) filter (where ${products.isOrganic})`,
    })
    .from(products)
    .where(eq(products.status, "active"));
  return { productCount: Number(row?.productCount ?? 0), organicCount: Number(row?.organicCount ?? 0) };
}
