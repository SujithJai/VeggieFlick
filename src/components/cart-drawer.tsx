"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatINR } from "@/lib/utils";
import { CategoryIconTile } from "@/components/ui/primitives";

export function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, setQuantity, removeItem } = useApp();
  const progress = Math.min(100, (cart.totals.subtotal / cart.totals.freeDeliveryThreshold) * 100);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping basket">
          <motion.button
            type="button"
            aria-label="Close basket"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.01em] text-ink">
                <ShoppingBag size={18} strokeWidth={1.6} className="text-brand-700" />
                Your basket
                {cart.itemCount > 0 && (
                  <span className="text-[13px] font-medium text-muted">
                    ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
                  </span>
                )}
              </h2>
              <button
                type="button"
                aria-label="Close basket"
                onClick={() => setDrawerOpen(false)}
                className="btn-ghost btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free-delivery progress */}
            {cart.items.length > 0 && (
              <div className="border-b border-line bg-surface px-5 py-3">
                <p className="text-[12px] font-medium text-ink">
                  {cart.totals.amountToFreeDelivery > 0 ? (
                    <>
                      Add{" "}
                      <span className="font-semibold text-brand-700">
                        {formatINR(cart.totals.amountToFreeDelivery)}
                      </span>{" "}
                      more for free delivery
                    </>
                  ) : (
                    <span className="font-semibold text-brand-700">
                      Free delivery unlocked
                    </span>
                  )}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-brand-700 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-brand-700">
                    <ShoppingBag size={26} strokeWidth={1.5} />
                  </span>
                  <p className="text-[15px] font-semibold">Your basket is empty</p>
                  <p className="max-w-xs text-[13px] text-muted">
                    Fresh vegetables, fruits and recipe kits are just a tap away.
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setDrawerOpen(false)}
                    className="btn btn-primary btn-sm mt-2"
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {cart.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-3 rounded-2xl border border-line p-3"
                    >
                      <CategoryIconTile icon={item.slug.split("-")[0]} size={56} />
                      <div className="flex-1">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className="line-clamp-1 text-[13px] font-semibold hover:text-brand-700"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-muted">{item.variantName}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-0.5 rounded-full border border-line bg-white">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center text-brand-700"
                              onClick={() => void setQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus size={12} strokeWidth={2} />
                            </button>
                            <span className="min-w-5 text-center text-[12px] font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center text-brand-700 disabled:opacity-40"
                              disabled={item.quantity >= item.availableStock}
                              onClick={() => void setQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus size={12} strokeWidth={2} />
                            </button>
                          </div>
                          <span className="text-[13px] font-semibold">
                            {formatINR(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => void removeItem(item.id)}
                        className="self-start text-muted transition-colors hover:text-danger"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="border-t border-line px-5 py-4">
                <dl className="mb-3 grid gap-1.5 text-[13px]">
                  <Row label="Subtotal" value={formatINR(cart.totals.subtotal, true)} />
                  {cart.totals.discount > 0 && (
                    <Row
                      label={`Coupon ${cart.totals.couponCode}`}
                      value={`−${formatINR(cart.totals.discount, true)}`}
                      tone="brand"
                    />
                  )}
                  <Row
                    label="Delivery"
                    value={cart.totals.deliveryCharge === 0 ? "FREE" : formatINR(cart.totals.deliveryCharge, true)}
                    tone={cart.totals.deliveryCharge === 0 ? "brand" : undefined}
                  />
                  <div className="mt-2 flex justify-between border-t border-line pt-3 text-[15px]">
                    <dt className="font-semibold">Total</dt>
                    <dd className="font-semibold">{formatINR(cart.totals.grandTotal, true)}</dd>
                  </div>
                </dl>
                <Link
                  href="/checkout"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-primary w-full"
                >
                  Proceed to checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-outline w-full mt-2"
                >
                  View full basket
                </Link>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
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
