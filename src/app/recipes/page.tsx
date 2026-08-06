import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Clock4, Users } from "lucide-react";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { Breadcrumb, SectionHeading } from "@/components/ui/primitives";
import { lookupIcon } from "@/lib/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recipes — Quick South Indian & continental dishes with fresh produce",
  description:
    "Simple, tested recipes built around VeggieFlick produce and ready-to-cook kits. Sambar, keerai masiyal, biryani and more.",
  alternates: { canonical: "/recipes" },
};

export default async function RecipesPage() {
  const rows = await db.select().from(recipes).where(eq(recipes.status, "active")).orderBy(desc(recipes.createdAt));

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Recipes" }]} />
      <SectionHeading
        eyebrow="Cook with VeggieFlick"
        title="Recipes for the produce in your basket"
        description="Every recipe uses ingredients you can add to your basket in a single tap."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((recipe) => {
          const Icon = lookupIcon(recipe.emoji);
          return (
            <article key={recipe.id} className="card card-lift overflow-hidden">
              <Link href={`/recipes/${recipe.slug}`}>
                <div className="relative aspect-[4/3] bg-surface">
                  <span className="absolute inset-0 flex items-center justify-center text-brand-700/60">
                    <Icon size={48} strokeWidth={1.3} />
                  </span>
                </div>
              </Link>
              <div className="p-4">
                <h2 className="text-[14px] font-semibold">
                  <Link href={`/recipes/${recipe.slug}`} className="hover:text-brand-700">
                    {recipe.title}
                  </Link>
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[12px] text-muted">{recipe.summary}</p>
                <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-muted">
                  <span className="flex items-center gap-1">
                    <Clock4 size={12} strokeWidth={1.6} /> {recipe.preparationTime + recipe.cookingTime} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} strokeWidth={1.6} /> {recipe.servings}
                  </span>
                  <span>{recipe.difficulty}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
