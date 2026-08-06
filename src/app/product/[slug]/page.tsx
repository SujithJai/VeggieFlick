import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/catalog";
import { ProductPurchasePanel } from "@/components/product-detail-client";
import { ProductCard } from "@/components/product-card";
import { Breadcrumb, Rating, SectionHeading } from "@/components/ui/primitives";
import { formatDateIST } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.seoTitle ?? `Buy ${product.name} Online in Chennai`,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.seoTitle ?? product.name,
      description: product.shortDescription ?? undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categorySlug, product.id, 8);
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "VeggieFlick" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.ratingAverageNumber,
      reviewCount: Math.max(1, product.ratingCount),
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: defaultVariant?.sellingPrice ?? 0,
      availability:
        (defaultVariant?.availableStock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.categoryName, href: `/shop?category=${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">{product.name}</h1>
        {product.tamilName && <p className="text-sm text-muted">{product.tamilName}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <Rating value={product.ratingAverageNumber} count={product.ratingCount} />
          <span className="text-muted">· {product.soldCount.toLocaleString("en-IN")} sold</span>
          {product.isOrganic && <span className="font-semibold text-brand-700">· Certified organic</span>}
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted">{product.shortDescription}</p>
      </div>

      <ProductPurchasePanel
        productId={product.id}
        productName={product.name}
        emoji={product.emoji}
        categorySlug={product.categorySlug}
        variants={product.variants}
      />

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <article className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold">About this product</h2>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted">{product.description}</p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface p-3">
              <dt className="text-xs font-semibold text-muted uppercase">Origin</dt>
              <dd className="text-sm font-semibold">{product.origin ?? "Tamil Nadu"}</dd>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <dt className="text-xs font-semibold text-muted uppercase">Shelf life</dt>
              <dd className="text-sm font-semibold">{product.shelfLife ?? "Best consumed fresh"}</dd>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <dt className="text-xs font-semibold text-muted uppercase">SKU</dt>
              <dd className="text-sm font-semibold">{product.sku}</dd>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <dt className="text-xs font-semibold text-muted uppercase">Category</dt>
              <dd className="text-sm font-semibold">{product.categoryName}</dd>
            </div>
          </dl>

          {product.nutrition && product.nutrition.length > 0 && (
            <>
              <h3 className="mt-8 text-base font-bold">Nutrition per 100 g</h3>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {product.nutrition.map((row) => (
                    <tr key={row.label} className="border-b border-line last:border-0">
                      <th scope="row" className="py-2 text-left font-medium text-muted">
                        {row.label}
                      </th>
                      <td className="py-2 text-right font-semibold">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </article>

        <aside className="card p-6">
          <h2 className="text-lg font-bold">Customer reviews</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl font-extrabold">{product.ratingAverageNumber.toFixed(1)}</span>
            <div>
              <Rating value={product.ratingAverageNumber} />
              <p className="text-xs text-muted">{product.ratingCount} verified ratings</p>
            </div>
          </div>

          <ul className="mt-5 grid gap-4">
            {product.reviews.length === 0 && (
              <li className="text-sm text-muted">
                No written reviews yet. Order once and share your experience.
              </li>
            )}
            {product.reviews.map((review) => (
              <li key={review.id} className="border-b border-line pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{review.reviewTitle}</p>
                  <Rating value={review.rating} />
                </div>
                <p className="mt-1 text-sm text-muted">{review.review}</p>
                <p className="mt-1.5 text-xs text-muted">
                  {review.authorName} · {formatDateIST(review.createdAt)}
                  {review.isVerifiedPurchase && (
                    <span className="ml-1 font-semibold text-brand-700">· Verified purchase</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            eyebrow="You may also like"
            title={`More from ${product.categoryName}`}
            href={`/shop?category=${product.categorySlug}`}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {related.slice(0, 8).map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 rounded-[20px] bg-brand-50 p-6 text-center">
        <p className="text-sm font-semibold text-brand-800">
          Cooking with {product.name.toLowerCase()} tonight?
        </p>
        <Link href="/recipes" className="mt-2 inline-block text-sm font-bold text-brand-700 underline">
          Browse matching recipes →
        </Link>
      </div>
    </div>
  );
}
