import type { Metadata } from "next";
import Link from "next/link";
import { listCategories, listProducts } from "@/lib/services/catalog";
import { productQuerySchema } from "@/lib/validation";
import { ProductCard } from "@/components/product-card";
import { Breadcrumb, EmptyState } from "@/components/ui/primitives";
import { ShopFilters } from "@/components/shop-filters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const label = search
    ? `Search results for “${search}”`
    : category
      ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Shop all fresh produce";

  return {
    title: `${label} — Online Vegetable & Fruit Delivery in Chennai`,
    description: `Buy ${label.toLowerCase()} online in Chennai from VeggieFlick. Harvested daily, delivered in your chosen slot within 25 km. Free delivery above ₹499.`,
    alternates: { canonical: category ? `/shop?category=${category}` : "/shop" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 0) flat[key] = value;
  });

  const parsed = productQuerySchema.safeParse({ ...flat, limit: flat.limit ?? "24" });
  const query = parsed.success
    ? parsed.data
    : productQuerySchema.parse({ page: "1", limit: "24", sort: "popularity" });

  let items: any[] = [];
  let total = 0;
  let categories: any[] = [];

  try {
    const [result, catList] = await Promise.all([listProducts(query), listCategories()]);
    items = result.items;
    total = result.total;
    categories = catList;
  } catch (error) {
    console.error("ShopPage DB load error:", error);
  }
  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  function pageHref(page: number) {
    const next = new URLSearchParams(flat);
    next.set("page", String(page));
    return `/shop?${next.toString()}`;
  }

  const activeCategory = categories.find((category) => category.slug === query.category);

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(activeCategory ? [{ label: activeCategory.name }] : []),
        ]}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          {query.search
            ? `Results for “${query.search}”`
            : (activeCategory?.name ?? "All fresh produce")}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          {activeCategory?.description ??
            "Sorted, graded and delivered the same day across Chennai. Choose a slot at checkout."}
        </p>
      </header>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Link
          href="/shop"
          className={`chip border whitespace-nowrap ${!query.category ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-muted"}`}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className={`chip border whitespace-nowrap ${
              query.category === category.slug
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-line text-muted"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="lg:contents">
          <div className="lg:order-1">
            <ShopFilters categories={categories} total={total} />
          </div>
        </div>

        <section className="lg:order-2" aria-label="Product results">
          {items.length === 0 ? (
            <EmptyState
              icon="search"
              title="No products match these filters"
              description="Try widening your price range or clearing a few filters — our catalogue refreshes every morning."
              action={
                <Link href="/shop" className="btn btn-primary px-5 py-2.5 text-sm">
                  Reset filters
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {items.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
                  {query.page > 1 && (
                    <Link href={pageHref(query.page - 1)} className="btn btn-outline px-4 py-2 text-sm">
                      Previous
                    </Link>
                  )}
                  <span className="px-3 text-sm text-muted">
                    Page <span className="font-semibold text-ink">{query.page}</span> of {totalPages}
                  </span>
                  {query.page < totalPages && (
                    <Link href={pageHref(query.page + 1)} className="btn btn-primary px-4 py-2 text-sm">
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
