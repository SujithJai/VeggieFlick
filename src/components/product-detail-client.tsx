"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Leaf, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";
import { DynamicIcon } from "@/lib/icons";

export type VariantOption = {
  id: string;
  variantName: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  availableStock: number;
};

const CATEGORY_HERO: Record<string, string> = {
  "fresh-vegetables": "/images/hero-fresh.jpg",
  "fresh-fruits": "/images/hero-fruits.jpg",
  organic: "/images/hero-organic.jpg",
  "exotic-vegetables": "/images/hero-exotic.jpg",
};

export function ProductPurchasePanel({
  productId,
  productName,
  emoji,
  categorySlug,
  variants,
}: {
  productId: string;
  productName: string;
  emoji: string;
  categorySlug: string;
  variants: VariantOption[];
}) {
  const router = useRouter();
  const { addItem, user, notify } = useApp();
  const [selected, setSelected] = useState(variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const outOfStock = !selected || selected.availableStock <= 0;
  const hero = CATEGORY_HERO[categorySlug];

  async function handleAdd(buyNow = false) {
    if (!selected) return;
    setBusy(true);
    const done = await addItem(productId, selected.id, quantity);
    setBusy(false);
    if (done && buyNow) router.push("/checkout");
  }

  async function saveToWishlist() {
    if (!user) {
      notify("Sign in to save items to your wishlist", "error");
      return;
    }
    const res = await fetch("/api/v1/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId: selected?.id }),
    });
    const json = await res.json();
    notify(json?.data?.saved ? "Saved to wishlist" : "Removed from wishlist");
  }

  function checkDelivery() {
    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryMessage("Enter a valid 6 digit Chennai pincode.");
      return;
    }
    if (!pincode.startsWith("600") && !pincode.startsWith("601") && !pincode.startsWith("603")) {
      setDeliveryMessage("Sorry, we deliver only within 25 km of Chennai today.");
      return;
    }
    setDeliveryMessage("Deliverable — choose your slot at checkout. Free delivery above ₹499.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* Image */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface">
          {hero ? (
            <Image
              src={hero}
              alt={productName}
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              priority
              className="object-cover"
            />
          ) : (
          <span className="absolute inset-0 flex items-center justify-center text-brand-700/60">
            <DynamicIcon name={emoji} size={140} strokeWidth={1.1} />
          </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {["leaf", "shopping-bag", "leaf", "truck"].map((name, i) => (
            <span
              key={i}
              className="flex aspect-square items-center justify-center rounded-2xl border border-line bg-white text-brand-700/70"
            >
              <DynamicIcon name={name} size={24} strokeWidth={1.3} />
            </span>
          ))}
        </div>
      </div>

      {/* Purchase */}
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {selected && selected.discountPercentage > 0 && (
            <Badge tone="offer">
              {Math.round(selected.discountPercentage)}% OFF
            </Badge>
          )}
          <Badge tone="fresh" icon="leafy">
            Harvested today
          </Badge>
          <Badge tone="brand" icon="delivery">
            Slot delivery
          </Badge>
        </div>

        <div className="mb-5 flex items-baseline gap-3">
          <span className="text-4xl font-bold tracking-[-0.02em] text-ink">
            {formatINR(selected?.sellingPrice ?? 0)}
          </span>
          {selected && selected.mrp > selected.sellingPrice && (
            <span className="text-lg text-muted line-through">{formatINR(selected.mrp)}</span>
          )}
        </div>
        <p className="text-[13px] text-muted">Inclusive of all taxes · {selected?.variantName}</p>

        <fieldset className="my-6">
          <legend className="mb-2.5 text-[13px] font-semibold text-ink">Choose pack size</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelected(variant);
                  setQuantity(1);
                }}
                disabled={variant.availableStock <= 0}
                className={`rounded-2xl border px-4 py-3 text-left text-[13px] transition-colors disabled:opacity-40 ${
                  selected?.id === variant.id
                    ? "border-brand-700 bg-brand-50 text-brand-800"
                    : "border-line hover:border-brand-300"
                }`}
              >
                <span className="block font-semibold">{variant.variantName}</span>
                <span className="mt-0.5 block text-[12px] text-muted">
                  {formatINR(variant.sellingPrice)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="flex h-10 w-10 items-center justify-center text-brand-700 disabled:opacity-40"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus size={14} strokeWidth={2} />
            </button>
            <span className="min-w-10 text-center text-[14px] font-semibold">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="flex h-10 w-10 items-center justify-center text-brand-700 disabled:opacity-40"
              disabled={!selected || quantity >= Math.min(10, selected.availableStock)}
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </div>
          <p className="text-[12px] font-semibold text-brand-700">
            {outOfStock ? "Out of stock" : `${selected?.availableStock} in stock at Chennai hub`}
          </p>
        </div>

        <div className="mb-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={outOfStock || busy}
            onClick={() => void handleAdd(false)}
            className="btn btn-primary disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add to basket"}
          </button>
          <button
            type="button"
            disabled={outOfStock || busy}
            onClick={() => void handleAdd(true)}
            className="btn btn-secondary disabled:opacity-50"
          >
            Buy now
          </button>
          <button
            type="button"
            onClick={() => void saveToWishlist()}
            className="btn btn-outline sm:col-span-2"
          >
            <Heart size={15} strokeWidth={1.6} aria-hidden /> Save to wishlist
          </button>
        </div>

        <div className="rounded-2xl border border-line p-4">
          <label className="text-[13px] font-semibold text-ink" htmlFor="pincode">
            Check delivery availability
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="pincode"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="600040"
              className="field"
            />
            <button type="button" onClick={checkDelivery} className="btn btn-outline">
              Check
            </button>
          </div>
          {deliveryMessage && (
            <p role="status" className="mt-2 text-[12px] font-medium text-brand-700">
              {deliveryMessage}
            </p>
          )}
        </div>

        <ul className="mt-5 grid gap-2 text-[12px] text-muted">
          <li className="flex items-center gap-2">
            <Truck size={14} className="text-brand-700" /> Free delivery on orders above ₹499
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-brand-700" /> Same-day refund if quality is not met
          </li>
        </ul>
      </div>
    </div>
  );
}
