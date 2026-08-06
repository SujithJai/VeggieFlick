import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogs, categories, products, recipes } from "@/db/schema";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veggieflick.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productRows: { slug: string; updatedAt: Date }[] = [];
  let categoryRows: { slug: string }[] = [];
  let blogRows: { slug: string; updatedAt: Date }[] = [];
  let recipeRows: { slug: string; updatedAt: Date }[] = [];

  try {
    [productRows, categoryRows, blogRows, recipeRows] = await Promise.all([
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.status, "active")),
      db.select({ slug: categories.slug }).from(categories).where(eq(categories.status, "active")),
      db.select({ slug: blogs.slug, updatedAt: blogs.updatedAt }).from(blogs).where(eq(blogs.status, "active")),
      db.select({ slug: recipes.slug, updatedAt: recipes.updatedAt }).from(recipes).where(eq(recipes.status, "active")),
    ]);
  } catch (error) {
    console.warn("Sitemap DB fetch warning:", error);
  }

  const staticRoutes = ["", "/shop", "/about", "/help", "/blog", "/recipes", "/legal/privacy", "/legal/terms"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8,
    }),
  );

  return [
    ...staticRoutes,
    ...categoryRows.map((row) => ({
      url: `${baseUrl}/shop?category=${row.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...productRows.map((row) => ({
      url: `${baseUrl}/product/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...blogRows.map((row) => ({
      url: `${baseUrl}/blog/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...recipeRows.map((row) => ({
      url: `${baseUrl}/recipes/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
