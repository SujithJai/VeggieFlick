import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { blogs, recipes } from "@/db/schema";
import { handle, ok, parseQuery } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["blogs", "recipes", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export async function GET(request: Request) {
  return handle(async () => {
    const { type, limit } = parseQuery(request, schema);

    const blogRows =
      type === "recipes"
        ? []
        : await db
            .select({
              id: blogs.id,
              title: blogs.title,
              slug: blogs.slug,
              emoji: blogs.emoji,
              author: blogs.author,
              shortDescription: blogs.shortDescription,
              publishedAt: blogs.publishedAt,
            })
            .from(blogs)
            .where(eq(blogs.status, "active"))
            .orderBy(desc(blogs.publishedAt))
            .limit(limit);

    const recipeRows =
      type === "blogs"
        ? []
        : await db
            .select({
              id: recipes.id,
              title: recipes.title,
              slug: recipes.slug,
              emoji: recipes.emoji,
              summary: recipes.summary,
              preparationTime: recipes.preparationTime,
              cookingTime: recipes.cookingTime,
              difficulty: recipes.difficulty,
            })
            .from(recipes)
            .where(eq(recipes.status, "active"))
            .orderBy(desc(recipes.createdAt))
            .limit(limit);

    return ok({ blogs: blogRows, recipes: recipeRows });
  });
}
