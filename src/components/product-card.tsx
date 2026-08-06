"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatINR } from "@/lib/utils";
import { Badge, Rating } from "@/components/ui/primitives";
import { DynamicIcon } from "@/lib/icons";

export type ProductCardData = {
  id: string;
  name: string;
  tamilName: string | null;
  slug: string;
  emoji: string;
  shortDescription: string | null;
  isOrganic: boolean;
  isBestSeller: boolean;
  isFreshToday: boolean;
  rating: number;
  ratingCount: number;
  categorySlug: string;
  variantId: string;
  variantName: string;
  mrp: number;
  price: number;
  discountPercentage: number;
  availableStock: number;
};

/** Map category slug to a real product photo. */
const CATEGORY_HERO: Record<string, string> = {
  "fresh-vegetables": "/images/hero-fresh.jpg",
  "fresh-fruits": "/images/hero-fruits.jpg",
  organic: "/images/hero-organic.jpg",
  "exotic-vegetables": "/images/hero-exotic.jpg",
};

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const { cart, addItem, setQuantity, user, notify } = useApp();
  const line = cart.items.find((item) => item.variantId === product.variantId);
  const outOfStock = product.availableStock <= 0;
  const hero = CATEGORY_HERO[product.categorySlug];
  const discountPct = Math.round(product.discountPercentage);

  async function toggleWishlist() {
    if (!user) {
      notify("Sign in to save items to your wishlist", "error");
      return;
    }
    const res = await fetch("/api/v1/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, variantId: product.variantId }),
    });
    const json = await res.json();
    notify(json?.data?.saved ? "Saved to wishlist" : "Removed from wishlist");
  }

  return (
    <article
      className="card card-lift group relative flex h-full flex-col overflow-hidden bg-white"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Image area */}
      <Link
        href={`/product/${product.slug}`}
        aria-label={product.name}
        className="relative block aspect-square overflow-hidden bg-surface"
      >
        <span className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50/80 via-white to-surface text-brand-700 transition-transform duration-300 group-hover:scale-105">
          <DynamicIcon name={product.emoji} size={54} strokeWidth={1.3} />
        </span>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discountPct > 0 && (
            <span className="chip chip-offer">{discountPct}% OFF</span>
          )}
          {product.isOrganic && (
            <Badge tone="fresh">Organic</Badge>
          )}
          {product.isFreshToday && !product.isOrganic && (
            <Badge tone="brand">Fresh today</Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => void toggleWishlist()}
          aria-label={`Save ${product.name} to wishlist`}
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-muted shadow-sm backdrop-blur transition-colors hover:text-brand-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
          </svg>
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        <Rating value={product.rating} count={product.ratingCount} />

        <Link href={`/product/${product.slug}`}>
          <h3 className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        {product.tamilName && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{product.tamilName}</p>
        )}

        <p className="mt-1 text-[12px] text-muted">{product.variantName}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-[11px] text-muted line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {outOfStock ? (
            <span className="chip chip-muted">Out of stock</span>
          ) : line ? (
            <div className="flex items-center gap-0.5 rounded-full border border-brand-700 bg-brand-700 text-white">
              <button
                type="button"
                aria-label={`Decrease ${product.name}`}
                className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-brand-800"
                onClick={() => void setQuantity(line.id, line.quantity - 1)}
              >
                <Minus size={13} strokeWidth={2} />
              </button>
              <span className="min-w-6 text-center text-[13px] font-semibold">{line.quantity}</span>
              <button
                type="button"
                aria-label={`Increase ${product.name}`}
                className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-brand-800 disabled:opacity-40"
                disabled={line.quantity >= product.availableStock}
                onClick={() => void setQuantity(line.id, line.quantity + 1)}
              >
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void addItem(product.id, product.variantId, 1)}
              className="btn btn-outline btn-sm border-brand-700 font-semibold text-brand-700 hover:bg-brand-700 hover:text-white"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCarousel({ products }: { products: ProductCardData[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:px-0">
      {products.map((product, i) => (
        <div key={product.id} className="w-[15rem] shrink-0 md:w-[16.5rem]">
          <ProductCard product={product} index={i} />
        </div>
      ))}
    </div>
  );
}
