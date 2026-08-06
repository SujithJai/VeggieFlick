"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Tag, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatINR } from "@/lib/utils";
import { Breadcrumb, CategoryIconTile, EmptyState } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product-card";

type Coupon = {
  couponCode: string;
  title: string;
  minimumOrderAmount: string;
};

export default function CartPage() {
  const { cart, cartLoading, setQuantity, removeItem, clearCart, applyCoupon, removeCoupon } = useApp();
  const [code, setCode] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [recommended, setRecommended] = useState<ProductCardData[]>([]);

  useEffect(() => {
    fetch("/api/v1/coupon")
      .then((r) => r.json())
      .then((json) => json?.success && setCoupons(json.data as Coupon[]))
      .catch(() => undefined);
    fetch("/api/v1/products?bestSeller=true&limit=4")
      .then((r) => r.json())
      .then((json) => json?.success && setRecommended(json.data as ProductCardData[]))
      .catch(() => undefined);
  }, []);

  const progress = Math.min(100, (cart.totals.subtotal / cart.totals.freeDeliveryThreshold) * 100);

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Basket" }]} />
      <h1 className="mb-6 text-3xl font-bold tracking-[-0.02em] md:text-4xl">Your basket</h1>

      {cartLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-24 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : cart.items.length === 0 ? (
        <EmptyState
          title="Your basket is empty"
          description="Fresh vegetables, fruits and ready-to-cook kits are just a tap away. Free delivery on orders above ₹499."
          action={
            <Link href="/shop" className="btn btn-primary">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <section aria-label="Basket items">
            <div className="card mb-4 p-4">
              {cart.totals.amountToFreeDelivery > 0 ? (
                <p className="text-[13px] font-medium text-ink">
                  Add{" "}
                  <span className="font-semibold text-brand-700">
                    {formatINR(cart.totals.amountToFreeDelivery)}
                  </span>{" "}
                  more to unlock free delivery
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-brand-700">Free delivery unlocked</p>
              )}
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-brand-700 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="grid gap-3">
              {cart.items.map((item) => (
                <li key={item.id} className="card flex gap-4 p-4">
                  <CategoryIconTile icon={item.slug.split("-")[0]} size={72} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/product/${item.slug}`} className="text-[14px] font-semibold hover:text-brand-700">
                          {item.name}
                        </Link>
                        <p className="text-[12px] text-muted">{item.variantName}</p>
                        {item.mrp > item.unitPrice && (
                          <p className="mt-1 text-[11px] font-semibold text-brand-700">
                            You save {formatINR((item.mrp - item.unitPrice) * item.quantity)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => void removeItem(item.id)}
                        className="text-muted transition-colors hover:text-danger"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-0.5 rounded-full border border-line bg-white">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center text-brand-700"
                          onClick={() => void setQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={13} strokeWidth={2} />
                        </button>
                        <span className="min-w-6 text-center text-[13px] font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center text-brand-700 disabled:opacity-40"
                          disabled={item.quantity >= item.availableStock}
                          onClick={() => void setQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={13} strokeWidth={2} />
                        </button>
                      </div>
                      <p className="text-[15px] font-semibold">{formatINR(item.totalPrice, true)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/shop" className="btn btn-outline">Continue shopping</Link>
              <button type="button" onClick={() => void clearCart()} className="btn btn-outline">
                Clear basket
              </button>
            </div>

            {recommended.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 text-lg font-bold">Complete your basket</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {recommended.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              </section>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <h2 className="text-lg font-semibold">Order summary</h2>

              <div className="mt-4">
                {cart.totals.couponCode ? (
                  <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-brand-800">
                      <Tag size={14} strokeWidth={1.6} /> {cart.totals.couponCode} applied
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-danger"
                      onClick={() => void removeCoupon()}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const done = await applyCoupon(code.trim().toUpperCase());
                      if (done) setCode("");
                    }}
                  >
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      aria-label="Coupon code"
                      className="field"
                    />
                    <button type="submit" className="btn btn-outline">Apply</button>
                  </form>
                )}

                {!cart.totals.couponCode && coupons.length > 0 && (
                  <ul className="mt-3 grid gap-2">
                    {coupons.slice(0, 3).map((coupon) => (
                      <li key={coupon.couponCode}>
                        <button
                          type="button"
                          onClick={() => void applyCoupon(coupon.couponCode)}
                          className="w-full rounded-2xl border border-dashed border-brand-300 px-3 py-2 text-left text-[12px] hover:bg-brand-50"
                        >
                          <span className="font-bold text-brand-700">{coupon.couponCode}</span> · {coupon.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <dl className="mt-5 grid gap-2 text-[13px]">
                <Row label="Subtotal" value={formatINR(cart.totals.subtotal, true)} />
                {cart.totals.savings > 0 && (
                  <Row label="Savings on MRP" value={`−${formatINR(cart.totals.savings, true)}`} tone="brand" />
                )}
                {cart.totals.discount > 0 && (
                  <Row label="Coupon discount" value={`−${formatINR(cart.totals.discount, true)}`} tone="brand" />
                )}
                <Row
                  label="Delivery"
                  value={cart.totals.deliveryCharge === 0 ? "FREE" : formatINR(cart.totals.deliveryCharge, true)}
                />
                {cart.totals.taxAmount > 0 && (
                  <Row label="GST" value={formatINR(cart.totals.taxAmount, true)} />
                )}
                <div className="mt-1 flex justify-between border-t border-line pt-3 text-[15px]">
                  <dt className="font-semibold">Grand total</dt>
                  <dd className="font-semibold">{formatINR(cart.totals.grandTotal, true)}</dd>
                </div>
              </dl>

              <Link href="/checkout" className="btn btn-primary mt-5 w-full">
                Proceed to checkout
              </Link>
              <p className="mt-3 text-center text-[11px] text-muted">
                Prices are recalculated on our servers at checkout.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-medium ${tone === "brand" ? "text-brand-700" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
