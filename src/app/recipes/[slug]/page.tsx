import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Clock4, Flame, Users } from "lucide-react";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { Breadcrumb } from "@/components/ui/primitives";
import { DynamicIcon } from "@/lib/icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function loadRecipe(slug: string) {
  const [recipe] = await db.select().from(recipes).where(and(eq(recipes.slug, slug), eq(recipes.status, "active"))).limit(1);
  return recipe ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await loadRecipe(slug);
  if (!recipe) return { title: "Recipe not found" };
  return {
    title: `${recipe.title} Recipe`,
    description: recipe.summary ?? `${recipe.title} made with fresh VeggieFlick produce.`,
    alternates: { canonical: `/recipes/${recipe.slug}` },
  };
}

export default async function RecipeDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const recipe = await loadRecipe(slug);
  if (!recipe) notFound();

  const icon = recipe.emoji;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.summary,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions.map((step) => ({ "@type": "HowToStep", text: step })),
    prepTime: `PT${recipe.preparationTime}M`,
    cookTime: `PT${recipe.cookingTime}M`,
    recipeYield: `${recipe.servings} servings`,
  };

  return (
    <div className="container-page py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Recipes", href: "/recipes" }, { label: recipe.title }]} />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <h1 className="text-balance text-3xl font-bold tracking-[-0.02em] md:text-4xl">{recipe.title}</h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">{recipe.summary}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="chip chip-brand">
              <Clock4 size={12} strokeWidth={1.8} /> Prep {recipe.preparationTime} min
            </span>
            <span className="chip chip-brand">
              <Flame size={12} strokeWidth={1.8} /> Cook {recipe.cookingTime} min
            </span>
            <span className="chip chip-brand">
              <Users size={12} strokeWidth={1.8} /> Serves {recipe.servings}
            </span>
            <span className="chip chip-warning">{recipe.difficulty}</span>
          </div>

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl bg-surface">
          <span className="absolute inset-0 flex items-center justify-center text-brand-700/60">
            <DynamicIcon name={icon} size={80} strokeWidth={1.1} />
          </span>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-bold">Method</h2>
            <ol className="mt-5 grid gap-5">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[13px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-[14px] leading-relaxed text-ink/85 text-pretty">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-[16px] font-semibold">Ingredients</h2>
            <ul className="mt-4 grid gap-3 text-[13px]">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-700" aria-hidden />
                  {ingredient}
                </li>
              ))}
            </ul>
            <Link href="/shop" className="btn btn-primary mt-6 w-full">
              Shop these ingredients
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
