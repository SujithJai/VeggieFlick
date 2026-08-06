"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Save } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDateIST, formatINR } from "@/lib/utils";
import { StatusPill } from "@/components/ui/primitives";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  emoji: string;
  status: string;
  categoryName: string;
  isOrganic: boolean;
  price: string;
  mrp: string;
  stock: number | null;
};

type InventoryRow = {
  variantId: string;
  productName: string;
  emoji: string;
  variantName: string;
  sku: string;
  availableStock: number;
  reservedStock: number;
  reorderLevel: number;
  warehouseName: string;
};

type CouponRow = {
  id: string;
  couponCode: string;
  title: string;
  discountType: string;
  discountValue: string;
  minimumOrderAmount: string;
  usedCount: number;
  usageLimit: number;
  expiryDate: string;
  status: string;
};

type Category = { id: string; name: string };

const TABS = ["products", "inventory", "coupons"] as const;

function CatalogWorkspace() {
  const params = useSearchParams();
  const { notify } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>(
    (params.get("tab") as (typeof TABS)[number]) ?? "products",
  );
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, i, c, cat] = await Promise.all([
      fetch("/api/v1/admin/catalog?view=products&limit=50").then((r) => r.json()),
      fetch("/api/v1/admin/catalog?view=inventory&limit=50").then((r) => r.json()),
      fetch("/api/v1/admin/coupons").then((r) => r.json()),
      fetch("/api/v1/categories").then((r) => r.json()),
    ]);
    if (p?.success) setProducts(p.data as ProductRow[]);
    if (i?.success) setInventory(i.data as InventoryRow[]);
    if (c?.success) setCoupons(c.data as CouponRow[]);
    if (cat?.success) setCategories(cat.data.categories as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function saveStock(row: InventoryRow, availableStock: number) {
    setSavingId(row.variantId);
    const response = await fetch("/api/v1/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: row.variantId, availableStock }),
    });
    const json = await response.json();
    setSavingId(null);
    if (json?.success) {
      notify(`${row.productName} stock updated`);
      void load();
    } else {
      notify(json?.error?.message ?? "Could not update stock", "error");
    }
  }

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name")),
      categoryId: String(data.get("categoryId")),
      emoji: String(data.get("emoji") || "vegetables"),
      shortDescription: String(data.get("shortDescription")),
      description: String(data.get("description")),
      origin: String(data.get("origin") || "Tamil Nadu"),
      isOrganic: data.get("isOrganic") === "on",
      variantName: String(data.get("variantName") || "500 g"),
      weight: Number(data.get("weight") || 0.5),
      unit: String(data.get("unit") || "g"),
      mrp: Number(data.get("mrp")),
      sellingPrice: Number(data.get("sellingPrice")),
      availableStock: Number(data.get("availableStock") || 50),
    };
    const response = await fetch("/api/v1/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (json?.success) {
      notify("Product published");
      setShowProductForm(false);
      void load();
    } else {
      notify(json?.error?.message ?? "Could not create product", "error");
    }
  }

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        couponCode: String(data.get("couponCode")).toUpperCase(),
        title: String(data.get("title")),
        discountType: String(data.get("discountType")),
        discountValue: Number(data.get("discountValue")),
        minimumOrderAmount: Number(data.get("minimumOrderAmount") || 0),
        usageLimit: Number(data.get("usageLimit") || 1000),
        expiryDays: Number(data.get("expiryDays") || 30),
      }),
    });
    const json = await response.json();
    if (json?.success) {
      notify("Coupon created");
      (event.target as HTMLFormElement).reset();
      void load();
    } else {
      notify(json?.error?.message ?? "Could not create coupon", "error");
    }
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Catalogue & inventory</h1>
        <p className="text-sm text-muted">
          Manage products, warehouse stock and promotional coupons. Every change is audit logged.
        </p>
      </header>

      <div className="flex gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`chip border capitalize ${
              tab === item ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading catalogue…
        </div>
      ) : tab === "products" ? (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowProductForm((open) => !open)}
              className="btn btn-primary px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" aria-hidden /> {showProductForm ? "Close form" : "New product"}
            </button>
          </div>

          {showProductForm && (
            <form onSubmit={createProduct} className="card grid gap-3 p-5 md:grid-cols-3">
              <label className="grid gap-1.5 md:col-span-2">
                <span className="text-xs font-semibold">Product name</span>
                <input name="name" required className="field" placeholder="Ridge Gourd" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Emoji</span>
                <input name="emoji" className="field" placeholder="carrot" defaultValue="vegetables" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Category</span>
                <select name="categoryId" required className="field">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Origin</span>
                <input name="origin" className="field" placeholder="Hosur, Tamil Nadu" />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input name="isOrganic" type="checkbox" className="h-4 w-4 accent-brand-600" /> Organic
              </label>
              <label className="grid gap-1.5 md:col-span-3">
                <span className="text-xs font-semibold">Short description</span>
                <input name="shortDescription" required className="field" placeholder="Tender ridge gourd for kootu" />
              </label>
              <label className="grid gap-1.5 md:col-span-3">
                <span className="text-xs font-semibold">Description</span>
                <textarea name="description" required rows={3} className="field" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Variant name</span>
                <input name="variantName" className="field" defaultValue="500 g" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Weight</span>
                <input name="weight" type="number" step="0.01" className="field" defaultValue={0.5} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Unit</span>
                <select name="unit" className="field" defaultValue="g">
                  {["g", "kg", "pc", "bunch", "pack", "ml", "l"].map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">MRP (₹)</span>
                <input name="mrp" type="number" required className="field" defaultValue={60} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Selling price (₹)</span>
                <input name="sellingPrice" type="number" required className="field" defaultValue={45} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold">Opening stock</span>
                <input name="availableStock" type="number" className="field" defaultValue={60} />
              </label>
              <div className="md:col-span-3">
                <button type="submit" className="btn btn-primary px-5 py-2.5 text-sm">
                  <Save className="h-4 w-4" aria-hidden /> Publish product
                </button>
              </div>
            </form>
          )}

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-surface text-left text-xs text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <span className="mr-2" aria-hidden>
                        {product.emoji}
                      </span>
                      <span className="font-semibold">{product.name}</span>
                      {product.isOrganic && <span className="ml-2 text-xs text-brand-700">Organic</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{product.sku}</td>
                    <td className="px-4 py-3 text-muted">{product.categoryName}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{formatINR(product.price)}</span>{" "}
                      <span className="text-xs text-muted line-through">{formatINR(product.mrp)}</span>
                    </td>
                    <td className="px-4 py-3">{product.stock ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={product.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === "inventory" ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-surface text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Reorder level</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3 text-right">Update</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={row.variantId} className="border-t border-line">
                  <td className="px-4 py-3">
                    <span className="mr-2" aria-hidden>
                      {row.emoji}
                    </span>
                    <span className="font-semibold">{row.productName}</span>
                    <span className="ml-2 text-xs text-muted">{row.variantName}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{row.warehouseName}</td>
                  <td className="px-4 py-3">{row.reservedStock}</td>
                  <td className="px-4 py-3">{row.reorderLevel}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        row.availableStock === 0
                          ? "bg-red-50 text-red-700"
                          : row.availableStock <= row.reorderLevel
                            ? "bg-amber-50 text-amber-700"
                            : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {row.availableStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form
                      className="flex justify-end gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const input = new FormData(event.currentTarget).get("stock");
                        void saveStock(row, Number(input));
                      }}
                    >
                      <input
                        name="stock"
                        type="number"
                        min={0}
                        defaultValue={row.availableStock}
                        className="field w-24 py-1.5"
                        aria-label={`Stock for ${row.productName}`}
                      />
                      <button
                        type="submit"
                        disabled={savingId === row.variantId}
                        className="btn btn-outline px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <form onSubmit={createCoupon} className="card grid gap-3 p-5 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold">Code</span>
              <input name="couponCode" required className="field" placeholder="MONSOON20" />
            </label>
            <label className="grid gap-1.5 md:col-span-2">
              <span className="text-xs font-semibold">Title</span>
              <input name="title" required className="field" placeholder="20% off on monsoon greens" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold">Type</span>
              <select name="discountType" className="field">
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
                <option value="free_delivery">Free delivery</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold">Value</span>
              <input name="discountValue" type="number" className="field" defaultValue={10} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold">Min order (₹)</span>
              <input name="minimumOrderAmount" type="number" className="field" defaultValue={299} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold">Usage limit</span>
              <input name="usageLimit" type="number" className="field" defaultValue={1000} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold">Valid for (days)</span>
              <input name="expiryDays" type="number" className="field" defaultValue={30} />
            </label>
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full px-5 py-2.5 text-sm">
                Create coupon
              </button>
            </div>
          </form>

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-surface text-left text-xs text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Min order</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-line">
                    <td className="px-4 py-3 font-bold">{coupon.couponCode}</td>
                    <td className="px-4 py-3 text-muted">{coupon.title}</td>
                    <td className="px-4 py-3">{formatINR(coupon.minimumOrderAmount)}</td>
                    <td className="px-4 py-3">
                      {coupon.usedCount}/{coupon.usageLimit}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDateIST(coupon.expiryDate)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={coupon.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminCatalogPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted">Loading…</div>}>
      <CatalogWorkspace />
    </Suspense>
  );
}
