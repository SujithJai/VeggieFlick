"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Bike,
  Heart,
  Leaf,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { formatINR } from "@/lib/utils";
import { CategoryIconTile } from "@/components/ui/primitives";

type Category = { id: string; name: string; slug: string; icon: string };
type Suggestion = { name: string; slug: string; emoji: string; categoryName: string; price: string };

const DELIVERY_AREAS = [
  "Anna Nagar",
  "T. Nagar",
  "Adyar",
  "Velachery",
  "Porur",
  "OMR Thoraipakkam",
  "Ambattur",
  "Mylapore",
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { cart, user, logout, setDrawerOpen } = useApp();

  const [categories, setCategories] = useState<Category[]>([]);
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [area, setArea] = useState(DELIVERY_AREAS[0]);
  const [unread, setUnread] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setCategories(json.data.categories as Category[]);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/v1/notifications")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setUnread(json.data.unread as number);
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (term.trim().length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/v1/products/search?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((json) => {
          if (json?.success) setSuggestions(json.data as Suggestion[]);
        })
        .catch(() => undefined);
    }, 220);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = term.trim();
      setShowSuggest(false);
      router.push(`/shop?search=${encodeURIComponent(q)}`);
      setTerm("");
    },
    [term, router],
  );

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-white/90 backdrop-blur-xl">
      {/* Info bar */}
      <div className="border-b border-line/60 bg-white">
        <div className="container-page flex h-10 items-center justify-between gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <span className="info-pill">
              <Bike size={13} strokeWidth={1.6} aria-hidden />
              Free delivery above ₹499
            </span>
            <span className="info-pill hidden sm:inline-flex">
              <Leaf size={13} strokeWidth={1.6} aria-hidden />
              Harvested today
            </span>
            <span className="info-pill hidden md:inline-flex">
              <Sparkles size={13} strokeWidth={1.6} aria-hidden />
              10% cashback on first order
            </span>
          </div>
          <label className="info-pill">
            <MapPin size={13} strokeWidth={1.6} aria-hidden />
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="bg-transparent text-[12px] font-medium outline-none"
              aria-label="Delivery area"
            >
              {DELIVERY_AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Main header — 72px */}
      <div className="container-page flex h-[72px] items-center gap-4">
        <button
          type="button"
          className="btn-ghost btn-icon rounded-lg lg:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={20} strokeWidth={1.6} />
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="VeggieFlick home">
          <span className="text-[20px] font-bold tracking-[-0.03em] text-ink">
            Veggie<span className="text-brand-700">Flick</span>
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-2xl mx-auto">
          <form onSubmit={submitSearch} role="search">
            <label className="input-shell">
              <Search size={18} strokeWidth={1.6} className="text-muted" aria-hidden />
              <input
                value={term}
                onFocus={() => setShowSuggest(true)}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setShowSuggest(true);
                }}
                placeholder='Search “tomato”, “mango”, “organic”…'
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
                aria-label="Search products"
              />
            </label>
          </form>
          {showSuggest && suggestions.length > 0 && (
            <div className="card absolute top-full z-50 mt-2 w-full overflow-hidden p-1 shadow-lg">
              {suggestions.map((item) => (
                <Link
                  key={item.slug}
                  href={`/product/${item.slug}`}
                  onClick={() => setShowSuggest(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="text-brand-700">
                    <CategoryIconTile icon={item.slug.split("-")[0]} size={36} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink">{item.name}</span>
                  <span className="text-xs text-muted">{item.categoryName}</span>
                  <span className="text-sm font-semibold text-ink">
                    {formatINR(item.price)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/account?tab=wishlist"
            className="btn-ghost btn-icon hidden md:inline-flex"
            aria-label="Wishlist"
          >
            <Heart size={18} strokeWidth={1.6} />
          </Link>
          <Link
            href="/account?tab=notifications"
            className="btn-ghost btn-icon relative hidden md:inline-flex"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.6} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((o) => !o)}
              className="btn-ghost btn-icon"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-label="Account"
            >
              <User size={18} strokeWidth={1.6} />
            </button>
            {accountOpen && (
              <div
                className="card absolute right-0 z-50 mt-2 w-60 p-2 shadow-lg"
                role="menu"
                onMouseLeave={() => setAccountOpen(false)}
              >
                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-ink">{user.fullName}</p>
                      <p className="text-xs text-muted">+91 {user.phone}</p>
                    </div>
                    <Link href="/account" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">
                      My account
                    </Link>
                    <Link href="/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">
                      My orders
                    </Link>
                    {["admin", "super_admin", "manager", "warehouse_staff"].includes(user.role) && (
                      <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">
                        Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        void logout();
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">
                      Sign in with OTP
                    </Link>
                    <Link href="/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">
                      Track an order
                    </Link>
                    <Link href="/admin/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">
                      Staff portal
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn btn-primary btn-sm relative hidden sm:inline-flex"
            aria-label={`Open basket with ${cart.itemCount} items`}
          >
            <ShoppingBag size={15} strokeWidth={1.8} />
            <span>
              {cart.itemCount > 0
                ? `${cart.itemCount} · ${formatINR(cart.totals.subtotal)}`
                : "Basket"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost btn-icon relative sm:hidden"
            aria-label={`Basket: ${cart.itemCount} items`}
          >
            <ShoppingBag size={18} strokeWidth={1.6} />
            {cart.itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
                {cart.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category navigation — horizontal scroll */}
      <nav aria-label="Categories" className="hidden border-t border-line/70 lg:block">
        <div className="container-page flex items-center gap-1 py-2.5 overflow-x-auto scrollbar-hide">
          <Link
            href="/shop"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface hover:text-brand-700"
          >
            All products
          </Link>
          {categories.map((c) => {
            const Icon = require("lucide-react")[iconMap[c.icon] ?? "Leaf"] as any;
            return (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface hover:text-brand-700"
              >
                {Icon && <Icon size={14} strokeWidth={1.6} aria-hidden />}
                {c.name}
              </Link>
            );
          })}
          <Link
            href="/recipes"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface hover:text-brand-700"
          >
            Recipes
          </Link>
          <Link
            href="/blog"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface hover:text-brand-700"
          >
            Journal
          </Link>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-[84%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-semibold">Shop</span>
              <button
                type="button"
                aria-label="Close menu"
                className="btn-ghost btn-icon"
                onClick={() => setMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-1">
              {categories.map((c) => {
                const Icon = require("lucide-react")[iconMap[c.icon] ?? "Leaf"] as any;
                return (
                  <Link
                    key={c.id}
                    href={`/shop?category=${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface"
                  >
                    {Icon && <Icon size={18} strokeWidth={1.6} className="text-brand-700" />}
                    <span className="text-sm font-medium">{c.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-5 border-t border-line pt-5 text-sm">
              <Link href="/orders" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-surface">
                My orders
              </Link>
              <Link href="/recipes" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-surface">
                Recipes
              </Link>
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-surface">
                Journal
              </Link>
              <Link href="/about" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-surface">
                About
              </Link>
              <Link href="/help" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-surface">
                Help
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const iconMap: Record<string, string> = {
  vegetables: "Carrot",
  fruits: "Apple",
  leafy: "Leaf",
  cut: "Salad",
  organic: "Sprout",
  exotic: "Sparkles",
  salad: "Salad",
  ready: "Soup",
  fresh: "Sparkles",
};
