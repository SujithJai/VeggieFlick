"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, Star, X } from "lucide-react";

type Category = { id: string; name: string; slug: string; icon: string };

const SORTS = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount", label: "Highest discount" },
  { value: "rating", label: "Customer rating" },
];

const TOGGLES = [
  { key: "organic", label: "Organic only" },
  { key: "bestSeller", label: "Best sellers" },
  { key: "freshToday", label: "Fresh today" },
  { key: "cut", label: "Cut & ready" },
  { key: "inStock", label: "In stock only" },
];

const PRICE_BANDS = [
  { label: "Under ₹50", min: 0, max: 50 },
  { label: "₹50 – ₹100", min: 50, max: 100 },
  { label: "₹100 – ₹200", min: 100, max: 200 },
  { label: "₹200 & above", min: 200, max: 5000 },
];

const DISCOUNTS = [10, 20, 30];
const RATINGS = [4, 4.5];

export function ShopFilters({ categories, total }: { categories: Category[]; total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      });
      next.delete("page");
      router.push(`/shop?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const activeCategory = params.get("category");
  const activeSort = params.get("sort") ?? "popularity";
  const activeCount = Array.from(params.keys()).filter((key) => key !== "sort" && key !== "page").length;

  const panel = (
    <div className="grid gap-6">
      <div>
        <h3 className="mb-2 text-sm font-bold">Category</h3>
        <div className="grid gap-1">
          <button
            type="button"
            onClick={() => update({ category: null })}
            className={`rounded-lg px-3 py-2 text-left text-sm ${!activeCategory ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-surface"}`}
          >
            All categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => update({ category: category.slug })}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeCategory === category.slug ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-surface text-ink"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">Price</h3>
        <div className="grid gap-1">
          {PRICE_BANDS.map((band) => {
            const active = params.get("minPrice") === String(band.min) && params.get("maxPrice") === String(band.max);
            return (
              <button
                key={band.label}
                type="button"
                onClick={() =>
                  update(
                    active
                      ? { minPrice: null, maxPrice: null }
                      : { minPrice: String(band.min), maxPrice: String(band.max) },
                  )
                }
                className={`rounded-lg px-3 py-2 text-left text-sm ${active ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-surface"}`}
              >
                {band.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">Quick filters</h3>
        <div className="grid gap-2">
          {TOGGLES.map((toggle) => {
            const active = params.get(toggle.key) === "true";
            return (
              <label key={toggle.key} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => update({ [toggle.key]: active ? null : "true" })}
                  className="h-4 w-4 rounded border-line accent-brand-600"
                />
                {toggle.label}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">Discount</h3>
        <div className="flex flex-wrap gap-2">
          {DISCOUNTS.map((value) => {
            const active = params.get("minDiscount") === String(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ minDiscount: active ? null : String(value) })}
                className={`chip border ${active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-muted"}`}
              >
                {value}%+ off
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">Rating</h3>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((value) => {
            const active = params.get("minRating") === String(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ minRating: active ? null : String(value) })}
                className={`chip border ${active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-muted"}`}
              >
                <Star size={10} className="fill-[#f97316] text-[#f97316]" strokeWidth={1.5} aria-hidden /> {value}+
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/shop")}
        className="btn btn-outline w-full py-2 text-sm"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{total}</span> products
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="btn btn-outline px-3 py-2 text-sm lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{activeCount}</span>
            )}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">Sort</span>
            <select
              value={activeSort}
              onChange={(event) => update({ sort: event.target.value })}
              className="field w-auto py-2 text-sm"
              aria-label="Sort products"
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="card sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto p-5">{panel}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 bottom-0 left-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button type="button" aria-label="Close filters" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {panel}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary mt-4 w-full py-3 text-sm"
            >
              Show {total} products
            </button>
          </div>
        </div>
      )}
    </>
  );
}
