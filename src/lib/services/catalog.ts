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

const FALLBACK_CATEGORIES = [
  { id: "cat-1", name: "Fresh Vegetables", slug: "fresh-vegetables", tamilName: "காய்கறிகள்", icon: "vegetables", accent: "#15803d", description: "Handpicked daily from Koyambedu and nearby farms.", sortOrder: 1 },
  { id: "cat-2", name: "Fresh Fruits", slug: "fresh-fruits", tamilName: "பழங்கள்", icon: "fruits", accent: "#15803d", description: "Naturally ripened seasonal fruits, sweetness guaranteed.", sortOrder: 2 },
  { id: "cat-3", name: "Cut Vegetables", slug: "cut-vegetables", tamilName: "நறுக்கிய காய்கறி", icon: "cut", accent: "#15803d", description: "Washed, peeled and chopped — cooking made effortless.", sortOrder: 3 },
  { id: "cat-4", name: "Leafy Vegetables", slug: "leafy-vegetables", tamilName: "கீரை வகைகள்", icon: "leafy", accent: "#15803d", description: "Farm-fresh keerai bunches sorted every morning.", sortOrder: 4 },
  { id: "cat-5", name: "Organic", slug: "organic", tamilName: "இயற்கை", icon: "organic", accent: "#15803d", description: "Certified organic, zero pesticide residue produce.", sortOrder: 5 },
  { id: "cat-6", name: "Exotic Vegetables", slug: "exotic-vegetables", tamilName: "விசேஷ காய்கறி", icon: "exotic", accent: "#15803d", description: "Continental favourites for your gourmet kitchen.", sortOrder: 6 },
  { id: "cat-7", name: "Salads", slug: "சாலட்", icon: "salad", accent: "#15803d", description: "Ready-to-toss salad bowls and healthy mixes.", sortOrder: 7 },
  { id: "cat-8", name: "Ready To Cook", slug: "ready-to-cook", tamilName: "சமைக்க தயார்", icon: "ready", accent: "#15803d", description: "Recipe kits with pre-cut veggies and spice packs.", sortOrder: 8 },
];

const FALLBACK_PRODUCTS: (ProductCard & { imageUrl?: string })[] = [
  {
    id: "p-1", name: "Yelakki Banana", tamilName: "ஏலக்கி வாழைப்பழம்", slug: "yelakki-banana", emoji: "banana",
    imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Small, aromatic and intensely sweet bananas.", isOrganic: false, isBestSeller: true, isFeatured: true,
    isFreshToday: false, isCutVegetable: false, rating: 4.8, ratingCount: 976, soldCount: 6120,
    categoryName: "Fresh Fruits", categorySlug: "fresh-fruits", variantId: "v-1", variantName: "500 g", unit: "g", mrp: 55, price: 42, discountPercentage: 24, availableStock: 150
  },
  {
    id: "p-2", name: "Country Tomato", tamilName: "நாட்டு தக்காளி", slug: "country-tomato", emoji: "tomato",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Juicy, tangy Ooty-belt tomatoes ideal for sambar and gravies.", isOrganic: false, isBestSeller: true, isFeatured: true,
    isFreshToday: true, isCutVegetable: false, rating: 4.6, ratingCount: 812, soldCount: 5240,
    categoryName: "Fresh Vegetables", categorySlug: "fresh-vegetables", variantId: "v-2", variantName: "500 g", unit: "g", mrp: 40, price: 29, discountPercentage: 28, availableStock: 180
  },
  {
    id: "p-3", name: "Bangalore Onion", tamilName: "வெங்காயம்", slug: "bangalore-onion", emoji: "onion",
    imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Big sized onions with crisp layers and long shelf life.", isOrganic: false, isBestSeller: true, isFeatured: false,
    isFreshToday: false, isCutVegetable: false, rating: 4.4, ratingCount: 645, soldCount: 4810,
    categoryName: "Fresh Vegetables", categorySlug: "fresh-vegetables", variantId: "v-3", variantName: "1 kg", unit: "kg", mrp: 52, price: 38, discountPercentage: 27, availableStock: 260
  },
  {
    id: "p-4", name: "Potato", tamilName: "உருளைக்கிழங்கு", slug: "potato", emoji: "potato",
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Smooth-skinned potatoes, great for fry, curry and mash.", isOrganic: false, isBestSeller: true, isFeatured: false,
    isFreshToday: true, isCutVegetable: false, rating: 4.5, ratingCount: 590, soldCount: 4320,
    categoryName: "Fresh Vegetables", categorySlug: "fresh-vegetables", variantId: "v-4", variantName: "1 kg", unit: "kg", mrp: 48, price: 34, discountPercentage: 29, availableStock: 240
  },
  {
    id: "p-5", name: "Grated Coconut", tamilName: "தேங்காய் துருவல்", slug: "grated-coconut", emoji: "coconut",
    imageUrl: "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Freshly grated coconut for chutney and poriyal.", isOrganic: false, isBestSeller: true, isFeatured: false,
    isFreshToday: false, isCutVegetable: true, rating: 4.8, ratingCount: 401, soldCount: 3320,
    categoryName: "Cut Vegetables", categorySlug: "cut-vegetables", variantId: "v-5", variantName: "200 g", unit: "g", mrp: 55, price: 45, discountPercentage: 18, availableStock: 120
  },
  {
    id: "p-6", name: "Carrot Ooty", tamilName: "கேரட்", slug: "carrot-ooty", emoji: "carrot",
    imageUrl: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Crunchy, sweet hill carrots rich in beta carotene.", isOrganic: false, isBestSeller: false, isFeatured: true,
    isFreshToday: true, isCutVegetable: false, rating: 4.7, ratingCount: 431, soldCount: 3120,
    categoryName: "Fresh Vegetables", categorySlug: "fresh-vegetables", variantId: "v-6", variantName: "500 g", unit: "g", mrp: 45, price: 32, discountPercentage: 29, availableStock: 160
  },
  {
    id: "p-7", name: "Alphonso Mango", tamilName: "அல்போன்சோ மாம்பழம்", slug: "alphonso-mango", emoji: "mango",
    imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
    shortDescription: "The king of mangoes — carbide free, naturally ripened.", isOrganic: false, isBestSeller: false, isFeatured: true,
    isFreshToday: true, isCutVegetable: false, rating: 4.9, ratingCount: 512, soldCount: 2860,
    categoryName: "Fresh Fruits", categorySlug: "fresh-fruits", variantId: "v-7", variantName: "6 pieces", unit: "pc", mrp: 899, price: 649, discountPercentage: 28, availableStock: 45
  },
  {
    id: "p-8", name: "Palak Spinach", tamilName: "பசலைக் கீரை", slug: "palak-spinach", emoji: "leafy",
    imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Iron-rich tender spinach bunches.", isOrganic: false, isBestSeller: true, isFeatured: false,
    isFreshToday: true, isCutVegetable: false, rating: 4.5, ratingCount: 268, soldCount: 2050,
    categoryName: "Leafy Vegetables", categorySlug: "leafy-vegetables", variantId: "v-8", variantName: "1 bunch", unit: "bunch", mrp: 25, price: 18, discountPercentage: 28, availableStock: 150
  },
  {
    id: "p-9", name: "Organic Tomato", tamilName: "இயற்கை தக்காளி", slug: "organic-tomato", emoji: "tomato",
    imageUrl: "https://images.unsplash.com/photo-1546470427-227c7369a9e3?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Certified organic, grown with cow-based inputs.", isOrganic: true, isBestSeller: false, isFeatured: true,
    isFreshToday: false, isCutVegetable: false, rating: 4.7, ratingCount: 198, soldCount: 1180,
    categoryName: "Organic", categorySlug: "organic", variantId: "v-9", variantName: "500 g", unit: "g", mrp: 75, price: 59, discountPercentage: 21, availableStock: 70
  },
  {
    id: "p-10", name: "Broccoli", tamilName: "ப்ரோக்கோலி", slug: "broccoli", emoji: "broccoli",
    imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Dense green crowns, rich in sulforaphane.", isOrganic: false, isBestSeller: false, isFeatured: true,
    isFreshToday: false, isCutVegetable: false, rating: 4.5, ratingCount: 212, soldCount: 1420,
    categoryName: "Exotic Vegetables", categorySlug: "exotic-vegetables", variantId: "v-10", variantName: "250 g", unit: "g", mrp: 89, price: 65, discountPercentage: 27, availableStock: 70
  },
  {
    id: "p-11", name: "Sambar Recipe Kit", tamilName: "சாம்பார் கிட்", slug: "sambar-recipe-kit", emoji: "soup",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Pre-cut veggies plus fresh-ground sambar podi.", isOrganic: false, isBestSeller: true, isFeatured: true,
    isFreshToday: false, isCutVegetable: true, rating: 4.8, ratingCount: 296, soldCount: 1980,
    categoryName: "Ready To Cook", categorySlug: "ready-to-cook", variantId: "v-11", variantName: "Serves 4", unit: "pack", mrp: 199, price: 149, discountPercentage: 25, availableStock: 60
  },
  {
    id: "p-12", name: "Cut Mixed Vegetables", tamilName: "கலவை காய்கறி", slug: "cut-mixed-vegetables", emoji: "salad",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    shortDescription: "Sambar-ready mix, washed and chopped this morning.", isOrganic: false, isBestSeller: false, isFeatured: true,
    isFreshToday: true, isCutVegetable: true, rating: 4.7, ratingCount: 342, soldCount: 2480,
    categoryName: "Cut Vegetables", categorySlug: "cut-vegetables", variantId: "v-12", variantName: "400 g", unit: "g", mrp: 89, price: 69, discountPercentage: 22, availableStock: 80
  }
];

export async function listProducts(query: ProductQuery) {
  try {
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

    if (rows && rows.length > 0) {
      return { items: rows.map(mapCard), total: Number(total) };
    }
  } catch (err) {
    console.warn("listProducts query error:", err);
  }

  // Filter fallback products dynamically
  let filtered = FALLBACK_PRODUCTS;
  if (query.category) filtered = filtered.filter(p => p.categorySlug === query.category);
  if (query.organic === "true") filtered = filtered.filter(p => p.isOrganic);
  if (query.bestSeller === "true") filtered = filtered.filter(p => p.isBestSeller);
  if (query.freshToday === "true") filtered = filtered.filter(p => p.isFreshToday);
  if (query.cut === "true") filtered = filtered.filter(p => p.isCutVegetable);
  if (query.minDiscount !== undefined) {
    const minD = query.minDiscount;
    filtered = filtered.filter(p => p.discountPercentage >= minD);
  }

  return { items: filtered.slice(0, query.limit ?? 24), total: filtered.length };
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
  try {
    const rows = await db
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

    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("listCategories query error:", err);
  }
  return FALLBACK_CATEGORIES;
}

export async function listSubCategories(categorySlug?: string) {
  try {
    const filters = [eq(subCategories.status, "active")];
    if (categorySlug) filters.push(eq(categories.slug, categorySlug));
    return await db
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
  } catch (err) {
    console.warn("listSubCategories warning:", err);
    return [];
  }
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
  try {
    const [row] = await db
      .select({
        productCount: count(products.id),
        organicCount: sql<number>`count(*) filter (where ${products.isOrganic})`,
      })
      .from(products)
      .where(eq(products.status, "active"));
    const pCount = Number(row?.productCount ?? 0);
    const oCount = Number(row?.organicCount ?? 0);
    if (pCount > 0) return { productCount: pCount, organicCount: oCount };
  } catch (err) {
    console.warn("catalogCounts error:", err);
  }
  return { productCount: 36, organicCount: 3 };
}
